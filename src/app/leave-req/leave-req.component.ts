import { Component, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { getDatabase, ref, push, get } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { CommonModule, formatDate, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Database } from '@angular/fire/database';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-leave-req',
  templateUrl: './leave-req.component.html',
  styleUrls: ['./leave-req.component.css'],
  standalone: true,
  imports: [
    FormsModule, CommonModule,RouterModule,
  ],
})
export class LeaveReqComponent implements OnInit {

  private router = inject(Router);
  leaveData = {
    employeeName: '',
    reason: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    status: 'pending'
  };

  userEmail = '';
  currentDate = '';
  currentTime = '';
  userInitials: string = '';
  isBrowser = false;
  todayDate: string = '';
  isPermission = false;
  profileImageUrl: string | null = null;
  username: string = '';
  startTimeError: boolean = false;
  
endTimeError: boolean = false;

todayDate1: string = new Date().toISOString().split('T')[0];

holidayList: string[]= [
  '2025-01-01',
  '2025-01-14',
  '2025-01-15',
  '2025-01-16',
  '2025-01-26',
  '2025-02-11',
  '2025-04-14',
  '2025-04-18',
  '2025-05-01',
  '2025-08-15',
  '2025-08-16',
  '2025-08-27',
  '2025-10-02',
  '2025-10-20',
  '2025-12-25',
];
leaveData1= {
  startDate: '',
  endDate: ''
};

onDateChange(type: 'start' | 'end') {
  const date = type === 'start' ? this.leaveData.startDate : this.leaveData.endDate;
  if (this.holidayList.includes(date)) {
    alert(`${date} is a holiday. Please select another date.`);
    if (type === 'start') this.leaveData.startDate = '';
    else this.leaveData.endDate = '';
  }
}


  
  private db: Database; // Injected database instance

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private auth: Auth,db: Database) {
    this.db = db; // Store injected Database instance
  }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.getCurrentUserEmail();
      this.updateDateTime();
      setInterval(() => this.updateDateTime(), 1000);
     
      const now = new Date();
      this.todayDate = now.toISOString().split('T')[0];
    }
  }

  getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._]/);
  return parts.map(p => p[0].toUpperCase()).join('').substring(0, 2);
}

  // Get the current user's email
  getCurrentUserEmail() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userEmail = user.email || '';
        this.leaveData.employeeName = this.userEmail.split('@')[0];
        this.username = this.getUsername(this.userEmail); // 🛠️ Corrected
        this.loadProfilePicture();
        this.userInitials = this.getInitials(this.userEmail);
      }
    });
  }
  
  getUsername(email: string): string {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  loadProfilePicture() {
    console.log('Fetching image for:', this.username); 
    const imageRef = ref(this.db, `profile-images/${this.username}`);
    get(imageRef).then(snapshot => {
      if (snapshot.exists()) {
        console.log('Image found');
        this.profileImageUrl = snapshot.val();
      } else {
        console.log('No image found');
        this.profileImageUrl = null;
      }
    }).catch(error => {
      console.error('Error fetching profile image:', error);
    });
  }

  validateTimes() {
  this.startTimeError = false;
  this.endTimeError = false;

  const now = new Date();

  if (this.leaveData.startTime) {
    const [startHour, startMinute] = this.leaveData.startTime.split(':').map(Number);

    const selectedStart = new Date(now);
    selectedStart.setHours(startHour, startMinute, 0, 0);

    if (selectedStart.getTime() <= now.getTime()) {
      this.startTimeError = true;
      console.log('❌ Start time is in the past!');
    }

    if (this.leaveData.endTime) {
      const [endHour, endMinute] = this.leaveData.endTime.split(':').map(Number);
      const selectedEnd = new Date(now);
      selectedEnd.setHours(endHour, endMinute, 0, 0);

      if (selectedEnd.getTime() <= selectedStart.getTime()) {
        this.endTimeError = true;
        console.log('❌ End time is before or equal to start time!');
      }

      // ✅ Check if end time exceeds 3 hours from start time
      const diffInMs = selectedEnd.getTime() - selectedStart.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);

      if (diffInHours > 3) {
        this.endTimeError = true;
        alert('⏰ End time should not exceed 3 hours from start time.');
        this.leaveData.endTime = '';
      }
    }
  }
}

  
  
  

  // Update current date and time
  updateDateTime() {
    const now = new Date();
    this.currentDate = formatDate(now, 'MMMM d, y', 'en-US');
    this.currentTime = formatDate(now, 'hh:mm:ss a', 'en-US');
  }

  // Submit leave request to Firebase
  submitLeave() {
    if (!this.isBrowser) return;

    if (!this.leaveData.employeeName.trim() || !this.leaveData.reason.trim()) {
      alert('⚠️ Please fill all fields.');
      return;
    }

    if (
      (this.isPermission && (!this.leaveData.startTime || !this.leaveData.endTime)) ||
      (!this.isPermission && (!this.leaveData.startDate || !this.leaveData.endDate))
    ) {
      alert('⚠️ Please complete all date/time fields.');
      return;
    }

    const db = getDatabase();
    const leaveRef = ref(db, 'leave-requests');

    // 🛠️ Format time into 12-hour format with AM/PM
    const formattedStartTime = this.isPermission ? this.formatTimeTo12Hour(this.leaveData.startTime) : '';
    const formattedEndTime = this.isPermission ? this.formatTimeTo12Hour(this.leaveData.endTime) : '';

    const data = {
      ...this.leaveData,
      email: this.userEmail,
      submittedAt: formatDate(new Date(), 'MMM d, y, hh:mm:ss a', 'en-US'),
      type: this.isPermission ? 'Permission' : 'Leave',
      status: 'pending',
      startTime: formattedStartTime,
      endTime: formattedEndTime
    };

    push(leaveRef, data)
      .then(() => {
        alert('✅ Your request submitted successfully!');
        this.resetForm();
        this.router.navigate(['/worklog']);
      })
      .catch(error => {
        console.error('❌ Error submitting your request:', error);
      });
  }

  // Format 24-hour time to 12-hour with AM/PM
  formatTimeTo12Hour(time24: string): string {
    if (!time24) return '';

    const [hourStr, minuteStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // convert '0' hour to '12'

    return `${this.padZero(hour)}:${this.padZero(minute)} ${ampm}`;
  }

  // Helper to pad single digits
  padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  // Reset form data
  resetForm() {
    this.leaveData = {
      employeeName: '',
      reason: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      status: 'pending'
    };
    this.isPermission = false;
  }
 
  
}
