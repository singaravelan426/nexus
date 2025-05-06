import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { WorkTrackerComponent } from './work-tracker/work-tracker.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeaveReqComponent } from './leave-req/leave-req.component';
import { StatusComponent } from './status/status.component';
import { LeaveNotificationComponent } from './leave-notification/leave-notification.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'worklog', component: WorkTrackerComponent },
  { path: 'leave', component: LeaveReqComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'status', component: StatusComponent },
  { path: 'notification', component: LeaveNotificationComponent }
];
