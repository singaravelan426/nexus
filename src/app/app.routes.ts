import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { WorkTrackerComponent } from './work-tracker/work-tracker.component';
import { LeaveNotificationComponent } from './leave-notification/leave-notification.component';
import { AdminComponent } from './admin/admin.component';
import { WorkDetailComponent } from './work-detail/work-detail.component';
import { LopReportComponent } from './lop-report/lop-report.component';
import { LeaveComponent } from './leave/leave.component';
import { AdminProjectComponent } from './admin-project/admin-project.component';
import { PerformanceReportComponent } from './performance-report/performance-report.component';




export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'worklog', component: WorkTrackerComponent },
  { path: 'addproject', component: AdminProjectComponent },
  { path: 'notification', component: LeaveNotificationComponent },
  { path: 'admin', component: AdminComponent },
 { path: 'work-detail', component: WorkDetailComponent },
 { path: 'leave', component: LeaveComponent },
 { path: 'report', component: PerformanceReportComponent },
  { 
    path: 'add-admin', 
    loadComponent: () => import('./add-admin/add-admin.component').then(m => m.AddAdminComponent) 
  },
  {
    path: 'leave-detail/:id',
    loadComponent: () => import('./leave-detail/leave-detail.component').then(m => m.LeaveDetailComponent)
  },{ path: 'lop-report', component: LopReportComponent }

];
