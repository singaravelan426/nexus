import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { WorkTrackerComponent } from './work-tracker/work-tracker.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeaveReqComponent } from './leave-req/leave-req.component';
import { NgModule } from '@angular/core';
import { StatusComponent } from './status/status.component';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    {path:'login', component: LoginComponent },
    { path: 'worklog', component: WorkTrackerComponent},
    { path: 'leave', component: LeaveReqComponent },
    {path: 'dashboard', component: DashboardComponent },
    {path: 'status',component: StatusComponent}
    
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }

