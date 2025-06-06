// import { Injectable, NgZone } from '@angular/core';
// import { fromEvent, merge, Subscription, timer } from 'rxjs';
// import { Router } from '@angular/router';

// @Injectable({ providedIn: 'root' })
// export class InactivityService {
//   private userActivityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
//   private activitySub: Subscription | null = null;
//   private timeoutSub: Subscription | null = null;
//   private logoutCallback: () => void = () => {};

//   constructor(private router: Router, private ngZone: NgZone) {}

//   startMonitoring(logoutFn: () => void, timeoutMs: number = 60000) {
//     this.logoutCallback = logoutFn;

//     const activityEvents$ = merge(
//       ...this.userActivityEvents.map(event => fromEvent(window, event)),
//       fromEvent(document, 'visibilitychange')
//     );

//     this.ngZone.runOutsideAngular(() => {
//       this.activitySub = activityEvents$.subscribe(() => {
//         this.handleVisibilityAndResetTimer(timeoutMs);
//       });
//     });

//     this.resetTimer(timeoutMs);
//   }

//   private handleVisibilityAndResetTimer(timeoutMs: number) {
//     if (document.visibilityState === 'visible') {
//       this.resetTimer(timeoutMs);
//     }
//   }

//   private resetTimer(timeoutMs: number) {
//     this.timeoutSub?.unsubscribe();

//     this.timeoutSub = timer(timeoutMs).subscribe(() => {
//       this.ngZone.run(() => {
//         this.logoutCallback();
//       });
//     });
//   }

//   stopMonitoring() {
//     this.activitySub?.unsubscribe();
//     this.timeoutSub?.unsubscribe();
//   }
// }

