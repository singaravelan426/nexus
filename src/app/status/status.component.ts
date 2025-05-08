import { Component, OnInit } from '@angular/core';
import { getDatabase, ref, onValue } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { CommonModule, formatDate } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css'],
  imports: [
    CommonModule,RouterModule
  ],
})
export class StatusComponent implements OnInit {
  leaveRequests: any[] = [];
  paginatedLeaveRequests: any[] = [];
  userEmail = '';
  isBrowser = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 2;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private auth: Auth) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.getCurrentUserEmail();
    }
  }

  getCurrentUserEmail() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userEmail = user.email || '';
        this.fetchLeaveRequests();
      }
    });
  }

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

      this.leaveRequests = tempRequests.reverse();
      this.updatePaginatedData();
    });
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedLeaveRequests = this.leaveRequests.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.leaveRequests.length / this.itemsPerPage);
  }
}

