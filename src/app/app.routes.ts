import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { WorkTrackerComponent } from './work-tracker/work-tracker.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login',component:LoginComponent},
    { path: 'tracker',component :WorkTrackerComponent}
];

