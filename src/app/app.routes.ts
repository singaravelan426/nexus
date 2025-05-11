import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { WorkTrackerComponent } from './work-tracker/work-tracker.component';

import { LeaveReqComponent } from './leave-req/leave-req.component';
import { StatusComponent } from './status/status.component';
import { LeaveNotificationComponent } from './leave-notification/leave-notification.component';
import { UserProfileComponent } from './user-profile/user-profile.component';



export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'worklog', component: WorkTrackerComponent },
  { path: 'leave', component: LeaveReqComponent },
  { path: 'status', component: StatusComponent },
  { path: 'notification', component: LeaveNotificationComponent },
  {path: 'profile', component:UserProfileComponent },
 
  { 
    path: 'add-admin', 
    loadComponent: () => import('./add-admin/add-admin.component').then(m => m.AddAdminComponent) 
  },
  {
    path: 'leave-detail/:id',
    loadComponent: () => import('./leave-detail/leave-detail.component').then(m => m.LeaveDetailComponent)
  }
];
