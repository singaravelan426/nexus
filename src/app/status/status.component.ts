import { Component, OnInit, Inject } from '@angular/core';
import { getDatabase, ref, onValue } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class StatusComponent implements OnInit {
  leaveRequests: any[] = [];
  filteredLeaveRequests: any[] = [];
  paginatedLeaveRequests: any[] = [];
  userEmail = '';
  isBrowser = false;
  isLoading = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 2;
  totalPagesArray: number[] = [];

  // Tab filter
  selectedTab: string = 'all';

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
      this.currentPage = 1;
      this.applyFilterAndPaginate();
    });
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.currentPage = 1;
    this.applyFilterAndPaginate();
  }

  applyFilterAndPaginate() {
    if (this.selectedTab === 'all') {
      this.filteredLeaveRequests = [...this.leaveRequests];
    } else {
      this.filteredLeaveRequests = this.leaveRequests.filter(
        leave => leave.status.toLowerCase() === this.selectedTab
      );
    }
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const total = this.getTotalPages();
    this.totalPagesArray = Array.from({ length: total }, (_, i) => i + 1);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedLeaveRequests = this.filteredLeaveRequests.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredLeaveRequests.length / this.itemsPerPage) || 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }
}
