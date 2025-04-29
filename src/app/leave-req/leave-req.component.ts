import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { getDatabase, ref, push } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { CommonModule, formatDate, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-leave-req',
  templateUrl: './leave-req.component.html',
  styleUrls: ['./leave-req.component.css'],
  standalone: true,
  imports: [
    FormsModule, CommonModule,
    HeaderComponent
  ],
})
export class LeaveReqComponent implements OnInit {
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

  isBrowser = false;
  todayDate: string = '';
  isPermission = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private auth: Auth) {}

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

  // Get the current user's email
  getCurrentUserEmail() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userEmail = user.email || '';
        this.leaveData.employeeName = this.userEmail.split('@')[0]; // Auto-fill name as email prefix
      }
    });
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
        alert('✅ Leave request submitted successfully!');
        this.resetForm();
      })
      .catch(error => {
        console.error('❌ Error submitting leave request:', error);
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
