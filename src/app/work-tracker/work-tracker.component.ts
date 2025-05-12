import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { getDatabase, ref, push, get, remove, set } from '@angular/fire/database';
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

  currentTimer: string = '00h:00m';
  selectedLocation: string = '';
  locationError: boolean = false;
  showAlert: boolean = false;
  isTimerRunning: boolean = false;
  isLoading: boolean = true;
  alertMessage: string = '';
  totalDurationInSeconds: number = 0;

  chartType: 'line' = 'line';

  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Working Hours',
      fill: false,
      borderColor: 'blue',
      tension: 0.1
    }]
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Date' },
        ticks: { maxRotation: 45, minRotation: 30 }
      },
      y: {
        title: { display: true, text:  'Duration (hours)' },
        suggestedMin: 0,
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      legend: { position: 'top' }
    }
  };

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

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit() {

    const savedState = localStorage.getItem('workTimerState');
    if (savedState) {
      const { startTimestamp, selectedLocation, isTimerRunning } = JSON.parse(savedState);
      if (isTimerRunning) {
        this.startTimestamp = startTimestamp;
        this.selectedLocation = selectedLocation;
        this.isTimerRunning = true;
  
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
      }
    }

    onAuthStateChanged(this.auth, user => {
      if (user) {
        this.ngZone.run(() => {
          this.userEmail = user.email || '';
          this.username = this.getUsername(this.userEmail);
          this.userInitials = this.getInitials(this.userEmail);
          this.checkMainAdmin(this.userEmail);
          this.checkAdminStatus(this.userEmail);
          this.loadWorkLogs();
          this.loadProfilePicture(); // ✅ Load image
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
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
    const imageRef = ref(db, `profile-images/${this.username}`);
    get(imageRef).then(snapshot => {
      if (snapshot.exists()) {
        this.profileImageUrl = snapshot.val();
      } else {
        this.profileImageUrl = null;
      }
    });
  }

  onAvatarOptionChange() {
    if (this.avatarOption === 'option3') {
      // Trigger file input for upload
      const fileInput = document.getElementById('avatarFileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.click(); // opens file dialog
      }
    }
    else if (this.avatarOption === 'option1') {
      this.router.navigate(['/notification']);
    }
    else if (this.avatarOption === 'option2') {
      this.router.navigate(['/add-admin']);
    }
    else if (this.avatarOption === 'option4') {
      this.router.navigate(['/profile']);
    }

    else if (this.avatarOption === 'option5') {
      this.removeProfilePicture();
    } 
    else if (this.avatarOption === 'option6') {
      this.router.navigate(['/status']);
    }
    
    else if (this.avatarOption === 'option7') {
      this.logout();
    }
    
    
    
    
  
    // Reset selection after action
    setTimeout(() => this.avatarOption = '', 100);
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
if (confirmed) {
    const db = getDatabase();
    const imageRef = ref(db, `profile-images/${this.username}`);
    remove(imageRef).then(() => {
      this.profileImageUrl = null;
      this.showSuccessAlert('🗑️ Profile picture removed.');
    });
  }
}


  logout() {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        this.showSuccessAlert('👋 Logged out successfully.');
        // Redirect to login page or home
        window.location.href = '/login'; // adjust route if needed
      })
      .catch((error) => {
        console.error('Logout error:', error);
        this.showSuccessAlert('❌ Logout failed.');
      });
  }



loadWorkLogs() {
const db = getDatabase();
const workLogsRef = ref(db, 'work-logs');
const leaveRef = ref(db, 'leave-requests');

type LeaveStatus = 'approved' | 'pending' | 'rejected';

Promise.all([get(workLogsRef), get(leaveRef)]).then(([workSnapshot, leaveSnapshot]) => {
const workData = workSnapshot.exists() ? workSnapshot.val() : {};
const leaveData = leaveSnapshot.exists() ? leaveSnapshot.val() : {};
const logsByDate: { [date: string]: { workSeconds: number } } = {};
const leaveStatusData: {
  [date: string]: { approved: number; pending: number; rejected: number };
} = {};

let totalSeconds = 0;

// Process work logs
for (const key in workData) {
  const log = workData[key];
  if (log.email === this.userEmail) {
    const [day, month, year] = log.date.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const durationSeconds = this.durationToSeconds(log.duration);

    if (!logsByDate[isoDate]) logsByDate[isoDate] = { workSeconds: 0 };
    logsByDate[isoDate].workSeconds += durationSeconds;
    totalSeconds += durationSeconds;
  }
}

// Process leave requests by status
for (const key in leaveData) {
  const leave = leaveData[key];
  if (leave.email === this.userEmail) {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const isoDate = d.toISOString().split('T')[0];
      if (!leaveStatusData[isoDate]) {
        leaveStatusData[isoDate] = { approved: 0, pending: 0, rejected: 0 };
      }

      const status = (leave.status?.toLowerCase() ?? '') as string;
      if (['approved', 'pending', 'rejected'].includes(status)) {
        leaveStatusData[isoDate][status as LeaveStatus]++;
      }
    }
  }
}

// Combine all dates
const allDates = new Set([
  ...Object.keys(logsByDate),
  ...Object.keys(leaveStatusData)
]);
const sortedDates = Array.from(allDates).sort();

const labels: string[] = [];
const workDataPoints: number[] = [];
const approvedData: number[] = [];
const pendingData: number[] = [];
const rejectedData: number[] = [];

for (const isoDate of sortedDates) {
  const [year, month, day] = isoDate.split('-');
  labels.push(`${day}/${month}/${year}`);

  const workSeconds = logsByDate[isoDate]?.workSeconds || 0;
  workDataPoints.push(+((workSeconds / 3600).toFixed(2))); // convert to hours

  const leave = leaveStatusData[isoDate] || { approved: 0, pending: 0, rejected: 0 };
  approvedData.push(leave.approved * 24);
  pendingData.push(leave.pending * 24);
  rejectedData.push(leave.rejected * 24);
}

this.chartData = {
  labels,
  datasets: [
    {
      label: 'Working Hours',
      data: workDataPoints,
      borderColor: 'blue',
      backgroundColor: 'transparent',
      tension: 0.2
    },
    {
      label: 'Approved Leave',
      data: approvedData,
      borderColor: 'green',
      backgroundColor: 'transparent',
      tension: 0.2
    },
    {
      label: 'Pending Leave',
      data: pendingData,
      borderColor: 'orange',
      backgroundColor: 'transparent',
      tension: 0.2
    },
    {
      label: 'Rejected Leave',
      data: rejectedData,
      borderColor: 'red',
      backgroundColor: 'transparent',
      tension: 0.2
    }
  ]
};

this.totalDurationInSeconds = totalSeconds;
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
      if (!this.selectedLocation) {
        this.locationError = true;
        event.target.checked = false;
        this.isTimerRunning = false;
        return;
      }

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
      const confirmStop = window.confirm('All Done? Click Confirm to Punch Out.');
      if (confirmStop) {
        this.isTimerRunning = false;
        this.stopWorkTimerAndSave();
      } else {
        event.target.checked = true;
        this.isTimerRunning = true;
      }
    }
  }

  startWorkTimer() {
    this.startTimestamp = Date.now();
    this.startTime = this.formatDate(new Date());
    this.isTimerRunning = true;
  
    // Save to localStorage
    localStorage.setItem('workTimerState', JSON.stringify({
      startTimestamp: this.startTimestamp,
      selectedLocation: this.selectedLocation,
      isTimerRunning: true
    }));
  
    this.timerSub = interval(1000).subscribe(() => {
      const now = Date.now();
      const elapsedMs = now - this.startTimestamp;
      this.secondsElapsed = Math.floor(elapsedMs / 1000);
      this.currentTimer = this.formatTime(this.secondsElapsed);
    });
  }
  

  stopWorkTimerAndSave() {
    const now = Date.now();
    const elapsedMs = now - this.startTimestamp;
    this.secondsElapsed = Math.floor(elapsedMs / 1000);
    this.currentTimer = this.formatTime(this.secondsElapsed);
  
    this.endTime = this.formatDate(new Date());
    this.submittedAt = this.formatDate(new Date());
  
    if (!this.selectedLocation) {
      this.locationError = true;
      return;
    }
  
    if (this.timerSub) this.timerSub.unsubscribe();
  
    const db = getDatabase();
    const workLog = {
      email: this.userEmail,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.currentTimer,
      location: this.selectedLocation,
      date: this.formatDate(new Date(), true),
      submittedAt: this.submittedAt
    };
  
    const logsRef = ref(db, 'work-logs');
    push(logsRef, workLog)
      .then(() => {
        this.showSuccessAlert('✅ Work log saved successfully!');
        this.loadWorkLogs();
      })
      .catch(err => {
        console.error('Error saving log:', err);
        this.showSuccessAlert('❌ Error saving work log.');
      });
  
    this.currentTimer = '00:00';
     // Clear saved state
  localStorage.removeItem('workTimerState');
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
    return `${h}:${m}`;
  }
  

  goToLeavePage() {
    this.router.navigate(['/leave']);
  }

  ngOnDestroy() {
    if (this.timerSub) this.timerSub.unsubscribe();
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  downloadExcelReport() {
    const db = getDatabase();
    const logsRef = ref(db, 'work-logs');
    get(logsRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userLogs = [];

        for (const key in data) {
          const log = data[key];
          if (log.email === this.userEmail) {
            userLogs.push({
              Date: log.date,
              'Start Time': log.startTime,
              'End Time': log.endTime,
              Duration: log.duration,
              Location: log.location,
            });
          }
        }

        if (userLogs.length === 0) {
          this.showSuccessAlert('⚠️ No work logs available for download.');
          return;
        }

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(userLogs);
        const workbook: XLSX.WorkBook = {
          Sheets: { 'Work Logs': worksheet },
          SheetNames: ['Work Logs']
        };

        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const fileName = `WorkLogs-${this.username}-${new Date().toISOString().slice(0, 10)}.xlsx`;

        saveAs(blob, fileName);
      } else {
        this.showSuccessAlert('⚠️ No work logs found.');
      }
    }).catch(error => {
      console.error('Error fetching logs:', error);
      this.showSuccessAlert('❌ Failed to generate report.');
    });
  }
}