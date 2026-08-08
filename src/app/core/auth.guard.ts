import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '../models';
import { AuthService } from './auth.service';

export function authGuard(expectedRole: Role): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn() || auth.role() !== expectedRole) {
      return router.createUrlTree(['/login']);
    }
    return true;
  };
}
