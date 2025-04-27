import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { getAuth, signOut } from 'firebase/auth';
import { Router } from '@angular/router';
import { getDatabase, ref, onValue } from 'firebase/database';
import { RouterModule } from '@angular/router';  // 👈 ADD THIS

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [
      RouterModule 
  ],
})
export class DashboardComponent implements OnInit {
  userEmail: string | null = null;
  currentTime: string = '';
  currentDate: string = '';
  totalDurationToday: string = '00:00:00';
  totalDurationOverall: string = '00:00:00';

  auth: Auth = inject(Auth);

  constructor(private router: Router) {}

  ngOnInit(): void {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      this.userEmail = user.email;
      this.fetchWorkLogs();
    } else {
      this.router.navigate(['/login']);
    }

    setInterval(() => {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString();
      this.currentDate = now.toLocaleDateString();
    }, 1000);
  }

  logout(): void {
    const auth = getAuth();
    signOut(auth).then(() => {
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error("Logout failed", error);
    });
  }

  fetchWorkLogs(): void {
    const db = getDatabase();
    const workLogRef = ref(db, 'work-logs');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let totalSecondsToday = 0;
    let totalSecondsAll = 0;

    onValue(workLogRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.email === this.userEmail) {
          const [h, m, s] = data.duration.split(':').map(Number);
          const durationInSeconds = h * 3600 + m * 60 + s;

          totalSecondsAll += durationInSeconds;

          if (data.date === today) {
            totalSecondsToday += durationInSeconds;
          }
        }
      });

      this.totalDurationToday = this.formatDuration(totalSecondsToday);
      this.totalDurationOverall = this.formatDuration(totalSecondsAll);
    });
  }

  private formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}
