import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, getAuth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // ✅ Add this

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule], // ✅ Add RouterModule here
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})


export class LoginComponent {
  private auth: Auth = inject(Auth);
  email = '';
  password = '';

  constructor(private router: Router) {}

  login() {
    const auth = getAuth();
    signInWithEmailAndPassword(auth, this.email, this.password)
      .then((userCredential) => {
        alert('✅ Login Successful!');
        this.router.navigate(['/dashboard']); // ✅ Route to Work Tracker
      })
      .catch((error) => {
        console.error(error);
        alert('❌ Login failed: ' + error.message);
      });
  }
}
