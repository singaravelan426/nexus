import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AppRoutingModule, routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';


import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeaveReqComponent } from './leave-req/leave-req.component';
import { WorkTrackerComponent } from './work-tracker/work-tracker.component';

const firebaseConfig = {
  apiKey: "AIzaSyDJg07izYy4Kq34rDMmCorqLRnQb59jWI4",
  authDomain: "nexus-tracker1.firebaseapp.com",
  databaseURL: "https://nexus-tracker1-default-rtdb.firebaseio.com",
  projectId: "nexus-tracker1",
  storageBucket: "nexus-tracker1.firebasestorage.app",
  messagingSenderId: "858687899784",
  appId: "1:858687899784:web:2cd1e0383efa21a455773d",
  measurementId: "G-C84MWQST9D"
};

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),FormsModule,CommonModule,DashboardComponent,LeaveReqComponent,WorkTrackerComponent,
    provideDatabase(() => getDatabase()), provideClientHydration(withEventReplay())]
};
