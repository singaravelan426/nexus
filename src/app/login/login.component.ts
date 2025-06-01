import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, getAuth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // ✅ Add this
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule,CommonModule], // ✅ Add RouterModule here
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})


export class LoginComponent {
  private auth: Auth = inject(Auth);
  email = '';
  password = '';
   loading = false;

  constructor(private router: Router) {}

  login() {
    this.loading = true;
    const auth = getAuth();
    signInWithEmailAndPassword(auth, this.email, this.password)
      .then((userCredential) => {
        setTimeout(() => {
        this.loading = false;
        this.router.navigate(['/worklog']);
      },1000);
      })
      .catch((error) => {
        setTimeout(() => {
        this.loading = false;
        alert('❌ Login failed: ' + error.message);
      }, 1000);
      });
  }
}