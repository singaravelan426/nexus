import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {  OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, set, push, remove, onValue } from 'firebase/database';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-admin',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './add-admin.component.html',
  styleUrls: ['./add-admin.component.css'],
  
})
export class AddAdminComponent implements OnInit  {
  userEmail: string | null = null;
  newAdminEmail: string = '';
  adminEmails: string[] = [];
  adminKeys: { [email: string]: string } = {}; // store Firebase keys for easy deletion

  ngOnInit() {
    const auth = getAuth();
    const user = auth.currentUser;

    // Check if the user is logged in to proceed
    if (user && user.email) {
      this.userEmail = user.email;
      this.loadAdminEmails();
    }
  }

  loadAdminEmails() {
    const db = getDatabase();
    const adminRef = ref(db, 'admin-list');

    onValue(adminRef, (snapshot) => {
      const val = snapshot.val();
      this.adminEmails = [];
      this.adminKeys = {};

      if (val) {
        for (let key in val) {
          const adminEmail = val[key];
          this.adminEmails.push(adminEmail);
          this.adminKeys[adminEmail] = key;
        }
      }
    });
  }

  addAdminEmail() {
    if (!this.newAdminEmail) return;

    const db = getDatabase();
    const adminRef = ref(db, 'admin-list');
    push(adminRef, this.newAdminEmail.trim()).then(() => {
      this.newAdminEmail = '';
      this.loadAdminEmails(); // Refresh the list after adding
    });
  }

  removeAdminEmail(email: string) {
    const db = getDatabase();
    const key = this.adminKeys[email];
    if (key) {
      const emailRef = ref(db, `admin-list/${key}`);
      remove(emailRef).then(() => {
        this.loadAdminEmails(); // Refresh the list after removal
      });
    }
  }
}