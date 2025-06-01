import { Component, OnInit } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Database, ref, onValue } from '@angular/fire/database';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  username: string = '';
  leaveRequests: any[] = [];
  uniqueEmployees: string[] = [];

  currentPage: number = 1;
 itemsPerPage: number = 3;
 pagedEmployees: string[] = [];

  constructor(private auth: Auth, private db: Database, private router: Router) {}

  ngOnInit(): void {
    const currentUser: User | null = this.auth.currentUser;

    if (currentUser && currentUser.email) {
      this.setUsernameFromEmail(currentUser.email);
    } else {
      this.auth.onAuthStateChanged(user => {
        if (user?.email) {
          this.setUsernameFromEmail(user.email);
        }
      });
    }

    // Fetch leave requests
    const leaveRef = ref(this.db, 'leave-requests');
    onValue(leaveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.values(data) as any[];
        this.leaveRequests = all.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        ).slice(0, 2);
      }
    });

    // Fetch unique employees from work logs
    const workLogsRef = ref(this.db, 'work-logs');
    onValue(workLogsRef, (snapshot) => {
      const data = snapshot.val();
      const emailSet = new Set<string>();

      if (data) {
        Object.values(data).forEach((log: any) => {
          if (log.email) {
            emailSet.add(log.email);
          }
        });
        this.uniqueEmployees = Array.from(emailSet);
        this.updatePagedEmployees(); 

      }
    });
  }

  private setUsernameFromEmail(email: string | null): void {
    this.username = email ? email.split('@')[0] : 'User';
  }

  formatLeaveDisplay(item: any): string {
    if (item.type === 'Leave') {
      return `${item.startDate} to ${item.endDate}`;
    } else if (item.type === 'Permission') {
      return `${item.startTime} to ${item.endTime}`;
    }
    return '';
  }

  getBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-primary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getUsername(email: string): string {
    return email.split('@')[0];
  }

  getInitials(email: string): string {
    return this.getUsername(email).slice(0, 2).toUpperCase();
  }


updatePagedEmployees(): void {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  const end = start + this.itemsPerPage;
  this.pagedEmployees = this.uniqueEmployees.slice(start, end);
}

goToPage(page: number): void {
  this.currentPage = page;
  this.updatePagedEmployees();
}

get totalPages(): number[] {
  return Array(Math.ceil(this.uniqueEmployees.length / this.itemsPerPage))
    .fill(0)
    .map((_, i) => i + 1);
}
goToWorkDetail(email: string): void {
  this.router.navigate(['/work-detail'], { queryParams: { email } });
}

}
