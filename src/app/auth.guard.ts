import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);

  const user = auth.currentUser;
  if (user) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
