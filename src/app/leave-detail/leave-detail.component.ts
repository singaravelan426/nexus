import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getDatabase, ref, onValue, update } from '@angular/fire/database';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf ,UpperCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-leave-detail',
  imports: [FormsModule, NgIf, RouterModule, CommonModule],
  templateUrl: './leave-detail.component.html',
  styleUrl: './leave-detail.component.css',
  

})
export class LeaveDetailComponent implements OnInit {
  requestId: string = '';
  request: any;
  comment: string = '';
totalLeaveRequest: number = 0;
totalHolidays: number = 0;
totalLeaves: number = 0;


  constructor(private route: ActivatedRoute, private router: Router) {}


holidayList: string[] = [
  '2025-01-01', '2025-01-14', '2025-01-15', '2025-01-16',
  '2025-01-26', '2025-02-11', '2025-04-14', '2025-04-18',
  '2025-05-01', '2025-06-15', '2025-06-16', '2025-08-27',
  '2025-10-02', '2025-10-20', '2025-12-25'
];

leaveDates: { date: string; isHoliday: boolean }[] = [];





  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id')!;
    this.loadRequest();
  }

  loadRequest() {
    const db = getDatabase();
    const requestRef = ref(db, `leave-requests/${this.requestId}`);
    onValue(requestRef, (snapshot) => {
      this.request = snapshot.val();
      this.calculateLeaveDates();
    });
  }

 updateStatus(status: 'approved' | 'rejected') {
  if (!this.comment.trim()) {
    alert('Admin comment is required before taking action.');
    return;
  }
    this.calculateLeaveDates();

  const db = getDatabase();
  const requestRef = ref(db, `leave-requests/${this.requestId}`);
  update(requestRef, {
    status: status,
    totalLeaveRequest:this.totalLeaveRequest,
    countOfLeaves:this.totalLeaves,
    countOfHolidays:this.totalHolidays,
    adminComment: this.comment
    
    
  }).then(() => {
    alert(`Request ${status} successfully!`);
    this.router.navigate(['/notification']);
  }).catch(err => console.error('Update failed', err));
}

calculateLeaveDates() {
  if (!this.request?.startDate || !this.request?.endDate) return;

  const start = new Date(this.request.startDate);
  const end = new Date(this.request.endDate);
  const dateArray: { date: string; isHoliday: boolean }[] = [];

  let holidayCount = 0;
  let leaveCount = 0;

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const isHoliday = this.holidayList.includes(dateStr);
    dateArray.push({ date: dateStr, isHoliday });

    if (isHoliday) {
      holidayCount++;
    }

    leaveCount++;
    current.setDate(current.getDate() + 1);
  }

  this.leaveDates = dateArray;
  this.totalLeaveRequest = leaveCount;
  this.totalHolidays = holidayCount;
  this.totalLeaves = leaveCount - holidayCount;
}






}