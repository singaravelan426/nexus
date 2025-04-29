import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { getDatabase, ref, onValue, update } from '@angular/fire/database';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-leave-notification',
  imports: [CommonModule, FormsModule, HeaderComponent],
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
  selectedTab: 'pending' | 'approved' | 'rejected' = 'pending';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
      this.pendingRequests = this.leaveRequests.filter(req => req.status === 'pending');
      this.approvedRequests = this.leaveRequests.filter(req => req.status === 'approved');
      this.rejectedRequests = this.leaveRequests.filter(req => req.status === 'rejected');
    });
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
}
