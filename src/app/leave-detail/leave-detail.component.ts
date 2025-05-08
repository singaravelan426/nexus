import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getDatabase, ref, onValue, update } from '@angular/fire/database';
import { FormsModule } from '@angular/forms';
import { NgIf ,UpperCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-leave-detail',
  imports: [FormsModule,NgIf,RouterModule,UpperCasePipe],
  templateUrl: './leave-detail.component.html',
  styleUrl: './leave-detail.component.css',
  

})
export class LeaveDetailComponent implements OnInit {
  requestId: string = '';
  request: any;
  comment: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id')!;
    this.loadRequest();
  }

  loadRequest() {
    const db = getDatabase();
    const requestRef = ref(db, `leave-requests/${this.requestId}`);
    onValue(requestRef, (snapshot) => {
      this.request = snapshot.val();
    });
  }

  updateStatus(status: 'approved' | 'rejected') {
    const db = getDatabase();
    const requestRef = ref(db, `leave-requests/${this.requestId}`);
    update(requestRef, {
      status: status,
      adminComment: this.comment
    }).then(() => {
      alert(`Request ${status} successfully!`);
      this.router.navigate(['/notification']); // Or return to list
    }).catch(err => console.error('Update failed', err));
  }
}