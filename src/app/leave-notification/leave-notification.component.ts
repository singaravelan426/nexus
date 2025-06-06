import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { getDatabase, ref, onValue, update } from '@angular/fire/database';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leave-notification',
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './leave-notification.component.html',
  standalone: true,
  styleUrls: ['./leave-notification.component.css']
})
export class LeaveNotificationComponent implements OnInit {
  leaveRequests: any[] = [];
  pendingRequests: any[] = [];
  approvedRequests: any[] = [];
  rejectedRequests: any[] = [];
  isBrowser = false;
  selectedTab: 'all' | 'pending' | 'approved' | 'rejected' = 'all'; // ✅ Show all by default
  currentPage: number = 1;
  itemsPerPage: number = 2; // You can adjust this
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object,private router: Router) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.fetchAllLeaveRequests();
    }
  }

  // Fetch and categorize leave requests by status
  fetchAllLeaveRequests() {
    const db = getDatabase();
    const leaveRef = ref(db, 'leave-requests');

    onValue(leaveRef, (snapshot) => {
      const tempRequests: any[] = [];
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        request.key = childSnapshot.key;
        tempRequests.push(request);
      });

      this.leaveRequests = tempRequests.reverse(); // Latest first

      // Categorize requests based on their status
      this.pendingRequests = this.leaveRequests.filter(req => req.status === 'all');
      this.pendingRequests = this.leaveRequests.filter(req => req.status === 'pending');
      this.approvedRequests = this.leaveRequests.filter(req => req.status === 'approved');
      this.rejectedRequests = this.leaveRequests.filter(req => req.status === 'rejected');
    });
  }

  // ✅ Add this method below fetchAllLeaveRequests
  getRequestsForSelectedTab(): any[] {
    let allRequests: any[] = [];
  
    switch (this.selectedTab) {
      case 'all':
      default:
        allRequests = this.leaveRequests;
        break;
      case 'pending':
        allRequests = this.pendingRequests;
        break;
      case 'approved':
        allRequests = this.approvedRequests;
        break;
      case 'rejected':
        allRequests = this.rejectedRequests;
        break;
    }
  
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return allRequests.slice(start, end);
  }
  
  getTotalPages(): number {
    let total = 0;
    switch (this.selectedTab) {
      case 'all':
        total = this.leaveRequests.length;
        break;
      case 'pending':
        total = this.pendingRequests.length;
        break;
      case 'approved':
        total = this.approvedRequests.length;
        break;
      case 'rejected':
        total = this.rejectedRequests.length;
        break;
    }
    return Math.ceil(total / this.itemsPerPage);
  }

  // Update the status of a leave request
  updateStatus(requestKey: string, newStatus: 'approved' | 'rejected', adminComment: string = '') {
    const db = getDatabase();
    const requestRef = ref(db, `leave-requests/${requestKey}`);

    update(requestRef, {
      status: newStatus,
      adminComment: adminComment || ''
    })
      .then(() => {
        alert(`Request ${newStatus} successfully!`);
      })
      .catch(error => {
        console.error('❌ Error updating status:', error);
      });
  }

  viewDetails(request: any) {
    this.router.navigate(['/leave-detail', request.key]);
  }

  

}