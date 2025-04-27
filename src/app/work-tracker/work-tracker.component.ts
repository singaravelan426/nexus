import { Component, OnInit } from '@angular/core';
import { getDatabase, ref, push } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { HeaderComponent } from '../header/header.component';


@Component({
  selector: 'app-work-tracker',
  templateUrl: './work-tracker.component.html',
  styleUrls: ['./work-tracker.component.css'],
  imports: [
    FormsModule, CommonModule,
    HeaderComponent
],
})
export class WorkTrackerComponent implements OnInit {
  projectTitle = '';
  projectDesc = '';
  startTime = '';
  endTime = '';
  duration = '';
  isTracking = false;
  startTimestamp = 0;
  timerInterval: any;
  currentTimer = '00:00:00';
  userEmail = '';
  currentDate = '';
  currentTime = '';

  isBrowser = false;


  constructor(@Inject(PLATFORM_ID) private platformId: Object,private auth: Auth) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  
    if (this.isBrowser) {
      this.getCurrentUserEmail();
      this.updateDateTime();
      setInterval(() => this.updateDateTime(), 1000);
    }
  }

  

  getCurrentUserEmail() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userEmail = user.email || '';
      }
    });
  }

  updateDateTime() {
    const now = new Date();
    this.currentDate = formatDate(now, 'MMMM d, y', 'en-US');
    this.currentTime = formatDate(now, 'hh:mm:ss a', 'en-US');
  }

  startWork() {
    this.isTracking = true;
    this.startTimestamp = Date.now();
    this.startTime = new Date(this.startTimestamp).toLocaleTimeString();

    this.timerInterval = setInterval(() => {
      const diff = Date.now() - this.startTimestamp;
      this.currentTimer = this.formatDuration(diff);
    }, 1000);
  }

  endWork() {
    this.isTracking = false;
    const endTimestamp = Date.now();
    clearInterval(this.timerInterval);
    this.endTime = new Date(endTimestamp).toLocaleTimeString();

    const totalDuration = endTimestamp - this.startTimestamp;
    this.duration = this.formatDuration(totalDuration);
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
  }

  pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  submitWork(){
    if (!this.isBrowser) return;

    if (!this.projectTitle.trim() || !this.projectDesc.trim()) {
      alert('⚠️ Please enter both Project Title and Description.');
      return;
    }

    if (!this.startTime || !this.endTime) {
      alert('⚠️ Please start and end the work session before submitting.');
      return;
    }
  
    const db = getDatabase();
    const workRef = ref(db, 'work-logs');
  
    const data = {
      email: this.userEmail,
      date: this.currentDate,
      projectTitle: this.projectTitle,
      projectDesc: this.projectDesc,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      submittedAt: formatDate(new Date(), 'MMM d, y, hh:mm:ss a', 'en-US')
    };
  
    push(workRef, data)
      .then(() => {
        alert('✅ Work submitted successfully!');
        this.resetForm();
      })
      .catch(error => {
        console.error('❌ Error submitting work:', error);
      });
  }

  resetForm() {
    this.projectTitle = '';
    this.projectDesc = '';
    this.startTime = '';
    this.endTime = '';
    this.duration = '';
    this.currentTimer = '00:00:00';
  }
}
