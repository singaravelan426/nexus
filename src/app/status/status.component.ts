import { Component, OnInit } from '@angular/core';
import { getDatabase, ref, onValue } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { CommonModule, formatDate } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css'],
  imports: [
    CommonModule,
    HeaderComponent
  ],
})
export class StatusComponent implements OnInit {
  leaveRequests: any[] = [];
  userEmail = '';
  isBrowser = false;
  

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private auth: Auth) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.getCurrentUserEmail();
    }
  }

  // Fetch current user email
  getCurrentUserEmail() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userEmail = user.email || '';
        this.fetchLeaveRequests();
      }
    });
  }

  // Fetch only current user's leave requests
  fetchLeaveRequests() {
    const db = getDatabase();
    const leaveRef = ref(db, 'leave-requests');

    onValue(leaveRef, (snapshot) => {
      const tempRequests: any[] = [];
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        if (request.email === this.userEmail) {
          tempRequests.push(request);
        }
      });
      this.leaveRequests = tempRequests.reverse(); // Latest first
    });
  }
}
