import { Component } from '@angular/core';
import { LeaveReqComponent } from '../leave-req/leave-req.component';
import { RouterModule } from '@angular/router';

import { StatusComponent } from '../status/status.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leave',
  imports: [LeaveReqComponent,StatusComponent,CommonModule,RouterModule],
  templateUrl: './leave.component.html',
  styleUrl: './leave.component.css'
})
export class LeaveComponent {
activeSection = 'leaveReq';
}
