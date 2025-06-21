import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { getDatabase, ref, push, get, remove, set, onValue } from '@angular/fire/database';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver-es';
import { NgZone } from '@angular/core';
import { inject } from '@angular/core';
import { RouterModule } from '@angular/router';
// import { InactivityService } from '../services/inactivity.service';
@Component({
  standalone: true,
  selector: 'app-work-tracker',
  templateUrl: './work-tracker.component.html',
  styleUrls: ['./work-tracker.component.css'],
  imports: [CommonModule, FormsModule, NgChartsModule,RouterModule]
})
export class WorkTrackerComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(Auth);

  userEmail: string = '';
  username: string = '';
  userInitials: string = '';
  profileImageUrl: string | null = null;
  projectTitle: string = '';
  currentTimer: string = '00:00:00';
  selectedLocation: string = '';
  locationError: boolean = false;
  showAlert: boolean = false;
  isTimerRunning: boolean = false;
  isLoading: boolean = true;
  alertMessage: string = '';
  totalDurationInSeconds: number = 0;
  chartType: 'bar' = 'bar';
  loading = false;


  private timerSub: Subscription | null = null;
  private refreshSub: Subscription | null = null;
  private secondsElapsed = 0;
  private startTime: string = '';
  private endTime: string = '';
  private submittedAt: string = '';
  avatarOption: string = '';
  isAdmin = false;
  isAdminMain=false;
  private startTimestamp: number = 0;


 filterType: string = 'weekly';
customStartDate: string = '';
customEndDate: string = '';
showDropdown: boolean = false;

  activeProjects: any[] = [];
  selectedProjectTasks: string[] = [];
  selectedTask: string = '';
tAt: number | null = null;

selectFilter(option: string) {
  this.filterType = option;
  this.showDropdown = false;
  this.loadWorkLogsByFilter();
}


  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit() {
  //   this.inactivityService.startMonitoring(() => {
  //   if (this.isTimerRunning) {
  //     this.stopWorkTimerAndSave();
  //   }
  //   localStorage.removeItem('workTimerState');
  //   signOut(this.auth).then(() => {
  //     this.router.navigate(['/login']);
      
  //   });
  // }, 60000);


   

  

    onAuthStateChanged(this.auth, user => {
    if (user) {
      this.ngZone.run(() => {
        this.userEmail = user.email || '';
        this.username = this.getUsername(this.userEmail);
        this.userInitials = this.getInitials(this.userEmail);
        this.checkMainAdmin(this.userEmail);
        this.checkAdminStatus(this.userEmail);
        this.filterType = 'weekly';
        this.loadActiveProjects().then(() => {
          this.restoreTimerState(); // ✅ safe to call after projects loaded
        });
        this.loadWorkLogsByFilter();
        this.loadProfilePicture();
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } else {
      this.router.navigate(['/login']);
    }
  });
}


  restoreTimerState() {
  const savedState = localStorage.getItem('workTimerState');
  if (savedState) {
    const {
      startTimestamp,
      selectedLocation,
      isTimerRunning,
      projectTitle,
      selectedTask,
      tAt,
      projectKey
    } = JSON.parse(savedState);

    if (isTimerRunning) {
      this.startTimestamp = startTimestamp;
      this.selectedLocation = selectedLocation;
      this.projectTitle = projectTitle;
      this.selectedTask = selectedTask || '';
      this.tAt = tAt ?? null;
      this.isTimerRunning = true;
      this.startTime = new Date(this.startTimestamp).toLocaleTimeString();

      // ✅ activeProjects is loaded now
      const selectedProject = this.activeProjects.find(p => p.key === projectKey);
      this.selectedProjectTasks = selectedProject ? Object.values(selectedProject.tasks || {}) : [];

      const now = Date.now();
      const elapsedMs = now - this.startTimestamp;
      this.secondsElapsed = Math.floor(elapsedMs / 1000);
      this.currentTimer = this.formatTime(this.secondsElapsed);

      this.timerSub = interval(1000).subscribe(() => {
        const now = Date.now();
        const elapsedMs = now - this.startTimestamp;
        this.secondsElapsed = Math.floor(elapsedMs / 1000);
        this.currentTimer = this.formatTime(this.secondsElapsed);
      });

      // ⚠️ Final validation warning
      if (!this.projectTitle || !this.selectedTask || this.tAt === null || this.tAt < 0) {
        alert('⚠️ Restored timer has incomplete or invalid data. Please stop and re-enter.');
      }
    }
  }
}




  

  getUsername(email: string): string {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  getInitials(email: string): string {
    const name = email.split('@')[0];
    const nameParts = name.split('.');
    return nameParts.map(part => part.charAt(0).toUpperCase()).join('');
  }

  checkMainAdmin(email: string) {
  this.isAdminMain = email === 'singam426@gmail.com';
}

  checkAdminStatus(email: string) {
    const db = getDatabase();
    const adminListRef = ref(db, 'admin-list');

    get(adminListRef).then((snapshot) => {
      if (snapshot.exists()) {
        const adminEmails: string[] = Object.values(snapshot.val());
        this.isAdmin = adminEmails.includes(email);
      } else {
        console.log("No admin list found.");
        this.isAdmin = false;
      }
    }).catch((error) => {
      console.error("Error checking admin status:", error);
      this.isAdmin = false;
    });
  }

 loadProfilePicture() {
  const db = getDatabase();
  const safeUsername = this.username.replace(/\./g, '_'); // Sanitize
  const imageRef = ref(db, `profile-images/${safeUsername}`);
  
  get(imageRef).then(snapshot => {
    if (snapshot.exists()) {
      this.profileImageUrl = snapshot.val();
    } else {
      this.profileImageUrl = null;
    }
  }).catch(error => {
    console.error('Error loading profile picture:', error);
    this.profileImageUrl = null;
  });
}





  loadActiveProjects(): Promise<void> {
  return new Promise((resolve) => {
    const db = getDatabase();
    const projectRef = ref(db, 'projects');

    onValue(projectRef, (snapshot) => {
      const data = snapshot.val();
      this.activeProjects = [];

      if (data) {
        for (const key in data) {
          if (data[key].active) {
            this.activeProjects.push({ key, ...data[key] });
          }
        }
      }

      resolve(); // 🔁 Notify when done loading
    });
  });
}

  onProjectChange() {
    const selectedProject = this.activeProjects.find(p => p.projectTitle === this.projectTitle);
    if (selectedProject && selectedProject.tasks) {
      this.selectedProjectTasks = Object.values(selectedProject.tasks);
    } else {
      this.selectedProjectTasks = [];
    }

    this.selectedTask = '';
  }

  


 onAvatarOptionChange() {
  switch (this.avatarOption) {

    case 'option1':
      this.loading=true;
      setTimeout(() => {
        this.router.navigate(['/report']);
      }, 500); 
      break;

    case 'option2':

        this.loading=true;
       setTimeout(() => {
      this.router.navigate(['/add-admin']);
       }, 500); 
      break;

    case 'option3':
      this.loading=true;
      setTimeout(() => {
      const fileInput = document.getElementById('avatarFileInput') as HTMLInputElement;
      this.loading=false;
      if (fileInput) {
        fileInput.click();
      }
       }, 500);
      break;

    case 'option5':
      this.loading = true; 
      setTimeout(() => {
      this.removeProfilePicture();
       }, 500);
      break;

    case 'option6':
     this.loading = true; 
     setTimeout(() => {
      this.router.navigate(['/leave']);
       }, 500);
      break;

    case 'option7':
     
      this.loading = true; 
      setTimeout(() => {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
       this.loading = false;
      if (confirmLogout) {
        this.logout();
      }
       }, 500);
      break;

      case 'option8':
     this.loading = true; 
     setTimeout(() => {
      this.router.navigate(['/addproject']);
       }, 500);
      break;
  }

  // Also reset after any action
  setTimeout(() => {
    this.avatarOption = '';
  }, 0);
}




  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadProfilePicture(input.files[0]);
    }
  }

  uploadProfilePicture(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result as string;
      const db = getDatabase();
      const imageRef = ref(db, `profile-images/${this.username}`);
      set(imageRef, base64Image).then(() => {
        this.profileImageUrl = base64Image;
        this.showSuccessAlert('✅ Profile picture uploaded!');
      });
    };
    reader.readAsDataURL(file);
  }

  removeProfilePicture() {
    const confirmed = window.confirm('Are you sure you want to delete your profile picture?');
    this.loading=false;
if (confirmed) {
    const db = getDatabase();
    const imageRef = ref(db, `profile-images/${this.username}`);
    remove(imageRef).then(() => {
      this.profileImageUrl = null;
      this.showSuccessAlert('🗑️ Profile picture removed.');
    });
  }
}


// logout dropdown

 logout() {
  if (this.isTimerRunning) {
    alert('⏳ Please stop the timer before logging out.');
    return;
  }

  // Clean local work timer state
  localStorage.removeItem('workTimerState');

  // Get auth and UID
  const user = this.auth.currentUser;
  if (user) {
    const uid = user.uid;
    const db = getDatabase();
    const tokenRef = ref(db, `activeTokens/${uid}`);

    // Remove token from Firebase
    set(tokenRef, null)
      .then(() => {
        localStorage.removeItem('sessionToken');

        // Now sign out
        return signOut(this.auth);
      })
      .then(() => {
        this.showSuccessAlert('👋 Logged out successfully.');
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Logout error:', error);
        this.showSuccessAlert('❌ Logout failed.');
      });
  } else {
    this.showSuccessAlert('❌ No active session.');
  }
}



//chart data

 chartData: ChartData<'bar'> = {
  labels: [],
  datasets: [
    {
      label: 'Working Hours',
      data: [],
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: canvasCtx, chartArea } = chart;
        if (!chartArea) return;

        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, '#facc15'); // yellow
        gradient.addColorStop(0.5, '#34d399'); // green
        gradient.addColorStop(1, '#60a5fa'); // blue
        return gradient;
      },
      hoverBackgroundColor: '#9333ea',
      borderRadius: 12,
      borderSkipped: false,
      barThickness: 30,
      categoryPercentage: 0.7,
      barPercentage: 0.9,
    }
  ]
};

chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1500,
    easing: 'easeInOutQuart'
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Date',
        color: '#0d0d0d',
        font: { weight: 'bold', size: 14 }
      },
      ticks: {
        maxRotation: 0,
        minRotation: 0,
        color: '#0d0d0d'
      },
      grid: { display: false }
    },
    y: {
  title: {
    display: true,
    text: 'Working Hours',
    color: '#0d0d0d',
    font: { weight: 'bold', size: 14 }
  },
  ticks: {
    stepSize: 3600,
    callback: (value: any) => {
      const hours = value / 3600;
      return hours < 1 ? '0 hrs' : (hours === 1 ? '1 hrs' : `${hours} hrs`);
    },
    color: '#0d0d0d'
  },
  suggestedMin: 0,
  suggestedMax: 28800, // 8 hours in seconds (8 * 3600)
  grid: {
    color: 'rgba(255,255,255,0.1)',
    borderDash: [4, 4]
  } as any
}

  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#0d0d0d',
        font: { size: 12, weight: 'bold' }
      }
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#facc15',
      bodyColor: '#e5e7eb',
      borderColor: '#3b82f6',
      borderWidth: 1
    }
  }
};


secondsToHHMMSS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}



loadWorkLogsByFilter() {
  const db = getDatabase();
  const workLogsRef = ref(db, 'work-logs');

  get(workLogsRef).then((snapshot) => {
    const allLogs = snapshot.exists() ? snapshot.val() : {};
    const filteredLogs: { [date: string]: number } = {};
    const now = new Date();

    for (const key in allLogs) {
      const log = allLogs[key];
      if (log.email !== this.userEmail) continue;

      const [day, month, year] = log.date.split('/');
      const logDate = new Date(`${year}-${month}-${day}`);
      const iso = logDate.toISOString().split('T')[0];

      let include = false;

      if (this.filterType === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        include = logDate >= oneWeekAgo && logDate <= now;
      } else if (this.filterType === 'monthly') {
        include = logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      } else if (this.filterType === 'yearly') {
        include = logDate.getFullYear() === now.getFullYear();
      } else if (this.filterType === 'custom' && this.customStartDate && this.customEndDate) {
        const start = new Date(this.customStartDate);
        const end = new Date(this.customEndDate);
        include = logDate >= start && logDate <= end;
      }

      if (include) {
        const duration = this.durationToSeconds(log.duration);
        filteredLogs[iso] = (filteredLogs[iso] || 0) + duration;
      }
    }

    const sortedDates = Object.keys(filteredLogs).sort();
    const labels = sortedDates.map(dateStr => {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const dataPoints = sortedDates.map(d => filteredLogs[d]);

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Working Hours',
          data: dataPoints,
          backgroundColor:'#3689F3',
          hoverBackgroundColor: '#9333ea',
          borderRadius: 12,
          borderSkipped: false,
          barThickness: 30,
          categoryPercentage: 0.7,
          barPercentage: 0.9,
        }
      ]
    };
  });
}






  durationToSeconds(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
      const [h, m] = parts;
      return h * 3600 + m * 60;
    }
    return 0;
  }



  onToggleTimer(event: any) {
  const isChecked = event.target.checked;

  if (isChecked) {
    // ✅ Starting timer — validate all required fields

    if (!this.selectedLocation) {
      this.locationError = true;
      alert('⚠️ Please select a location.');
      event.target.checked = false;
      this.isTimerRunning = false;
      return;
    }

    if (!this.projectTitle || this.projectTitle.trim() === '') {
      alert('⚠️ Please select a project.');
      event.target.checked = false;
      this.isTimerRunning = false;
      return;
    }

    if (!this.selectedTask || this.selectedTask.trim() === '') {
      alert('⚠️ Please select a task.');
      event.target.checked = false;
      this.isTimerRunning = false;
      return;
    }

    if (this.tAt === null || this.tAt < 0) {
      alert('⚠️ Please enter a valid TAT (minimum 1).');
      event.target.checked = false;
      this.isTimerRunning = false;
      return;
    }

    // 🟢 Confirm start
    const confirmStart = window.confirm('Ready to begin your workday? Click Confirm to start the timer.');
    if (confirmStart) {
      this.locationError = false;
      this.isTimerRunning = true;
      this.startWorkTimer();
    } else {
      event.target.checked = false;
      this.isTimerRunning = false;
    }

  } else {
    // ⏹️ Stopping the timer
    const confirmStop = window.confirm('All done? Click Confirm to Punch Out.');
    if (confirmStop) {
      this.isTimerRunning = false;
      this.stopWorkTimerAndSave();
    } else {
      event.target.checked = true;
      this.isTimerRunning = true;
    }
  }
}


  // timer satrt (toggle button)

  startWorkTimer() {
  this.startTimestamp = Date.now();
  this.startTime = new Date().toLocaleTimeString('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});
  this.isTimerRunning = true;

  // Save to localStorage
  const selectedProject = this.activeProjects.find(p => p.projectTitle === this.projectTitle);

localStorage.setItem('workTimerState', JSON.stringify({
  startTimestamp: this.startTimestamp,
  selectedLocation: this.selectedLocation,
  projectTitle: this.projectTitle,
  selectedTask: this.selectedTask,
  tAt: this.tAt,
  projectKey: selectedProject?.key, // ✅ save key
  isTimerRunning: true
}));

  this.timerSub = interval(1000).subscribe(() => {
    const now = Date.now();
    const elapsedMs = now - this.startTimestamp;
    this.secondsElapsed = Math.floor(elapsedMs / 1000);
    this.currentTimer = this.formatTime(this.secondsElapsed);
  });
}


  
// stop timer(toggle button) and data store db

 stopWorkTimerAndSave() {
  this.loading = true;

  setTimeout(() => {
    const now = Date.now();
    const elapsedMs = now - this.startTimestamp;
    this.secondsElapsed = Math.floor(elapsedMs / 1000);
    this.currentTimer = this.formatTime(this.secondsElapsed);

    this.endTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    this.submittedAt = this.formatDate(new Date());

    // ✅ Make sure timer is stopped
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = null;
    }

    // ✅ Clear persisted state
    localStorage.removeItem('workTimerState');

    const db = getDatabase();
    const logsRef = ref(db, 'work-logs');

    const workLog = {
      email: this.userEmail,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.currentTimer,
      projectTitle: this.projectTitle,
      selectedTask: this.selectedTask,
      tAt: this.tAt,
      location: this.selectedLocation,
      date: this.formatDate(new Date(), true),
      submittedAt: this.submittedAt
    };

    push(logsRef, workLog)
      .then(() => {
        this.showSuccessAlert('✅ Work log saved successfully!');
        this.loadWorkLogsByFilter();

        // ✅ Reset timer values
        this.currentTimer = '00:00:00';
        this.isTimerRunning = false;
      })
      .catch(err => {
        console.error('Error saving log:', err);
        this.showSuccessAlert('❌ Error saving work log.');
        this.isTimerRunning = true; // rollback
      })
      .finally(() => {
        this.loading = false;
      });

  }, 500);
}

  

  showSuccessAlert(message: string) {
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 3000);
  }

  formatDate(date: Date, isDateOnly: boolean = false): string {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    if (isDateOnly) {
      delete options.hour;
      delete options.minute;
      delete options.hour12;
    }
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  }

 formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');  // add seconds
  return `${h}:${m}:${s}`;
}
  

 

  ngOnDestroy() {
    if (this.timerSub) this.timerSub.unsubscribe();
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }



 

gotoviewwork(email: string): void {
  this.router.navigate(['/work-detail'], {
    queryParams: { email }
  });
}

  
//tap or browser close confirm msg

  @HostListener('window:beforeunload', ['$event'])
onBeforeUnload(event: BeforeUnloadEvent) {
  if (this.isTimerRunning) {
    event.preventDefault();
    event.returnValue = '';
  }

  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const uid = user.uid;
    const db = getDatabase();
    const tokenRef = ref(db, `activeTokens/${uid}`);

    // Remove session token from Firebase Realtime DB
    set(tokenRef, null);

    // Optional: clear localStorage
    localStorage.removeItem('sessionToken');
  }
}

}