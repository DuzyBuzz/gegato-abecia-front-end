import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Authentication Guard
 * Checks if user is logged in before accessing protected routes
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    console.warn('[authGuard] User not logged in - redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  return true;
};

/**
 * Role-Based Guard
 * Checks if user has required role(s) to access protected routes
 * Usage: Add to route data: { roles: ['Admin', 'Staff'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    console.warn('[roleGuard] User not logged in - redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data['roles'] as string[];

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (!auth.hasRole(allowedRoles)) {
    console.warn(`[roleGuard] User not authorized for this route - redirecting`);
    
    const redirectTo = route.data['redirectTo'] as string || '/login';
    router.navigate([redirectTo]);
    
    return false;
  }

  return true;
};
