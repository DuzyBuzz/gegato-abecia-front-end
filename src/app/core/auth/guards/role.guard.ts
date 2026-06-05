import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth-user.model';

export const roleGuard = (allowedRoles: UserRole | UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(allowedRoles)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
};
