import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, getAuth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getDatabase, ref, set, get, onValue } from '@angular/fire/database';
import { v4 as uuidv4 } from 'uuid'; // npm i uuid

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private auth: Auth = inject(Auth);
  email = '';
  password = '';
  loading = false;

  constructor(private router: Router) {}

  async login() {
    this.loading = true;
    const auth = getAuth();
    const db = getDatabase();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      const uid = userCredential.user.uid;
      const currentToken = uuidv4();
      const tokenRef = ref(db, `activeTokens/${uid}`);

      const snapshot = await get(tokenRef);
      const savedToken = snapshot.exists() ? snapshot.val() : null;

      // Check if user is already logged in from another device
      if (savedToken && savedToken !== currentToken) {
        this.loading = false;
        alert('⚠️ You have already logged in on another device.');
        return;
      }

      // Store the current token
      await set(tokenRef, currentToken);

      // Store token in localStorage to clean it up on logout
      localStorage.setItem('sessionToken', currentToken);

      setTimeout(() => {
        this.loading = false;
        this.router.navigate(['/worklog']);
      }, 1000);

    } catch (error: any) {
      setTimeout(() => {
        this.loading = false;
        alert('❌ Login failed: ' + error.message);
      }, 1000);
    }
  }
}
