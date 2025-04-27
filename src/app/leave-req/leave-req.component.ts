import { Component, OnInit } from '@angular/core';
import { getDatabase, ref, push } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-leave-req',
  templateUrl: './leave-req.component.html',
  styleUrls: ['./leave-req.component.css'],
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
    status: 'pending' // Default status is pending
  };

  userEmail = '';
  currentDate = '';
  currentTime = '';

  isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private auth: Auth) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.getCurrentUserEmail();
      this.updateDateTime();
      setInterval(() => this.updateDateTime(), 1000);
    }
  }

  // Get the current user's email
  getCurrentUserEmail() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userEmail = user.email || '';
        this.leaveData.employeeName = this.userEmail.split('@')[0]; // Auto-fill name as email prefix (optional)
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

    const db = getDatabase();
    const leaveRef = ref(db, 'leave-requests');

    const data = {
      ...this.leaveData,
      email: this.userEmail,
      submittedAt: formatDate(new Date(), 'MMM d, y, hh:mm:ss a', 'en-US'),
      status: 'pending' // Default status is pending
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

  // Reset form data
  resetForm() {
    this.leaveData = {
      employeeName: '',
      reason: '',
      startDate: '',
      endDate: '',
      status: 'pending' // Reset status to pending
    };
  }
}
