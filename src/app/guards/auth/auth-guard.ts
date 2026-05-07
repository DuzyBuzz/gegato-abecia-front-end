import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RoleAccess, resolveRoleAccess } from '../../utils/role-access.util';

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
 * Checks if user has required roleAccess values to access protected routes.
 * Usage: Add to route data: { roleAccess: [RoleAccess.Admin] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    console.warn('[roleGuard] User not logged in - redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  const allowedRoleAccess = (
    (route.data['roleAccess'] as Array<number | RoleAccess> | undefined)
    ?? (route.data['roles'] as Array<string | number> | undefined)?.map((role) => resolveRoleAccess(role, String(role)))
  )?.filter((role): role is RoleAccess => role !== undefined);

  if (!allowedRoleAccess || allowedRoleAccess.length === 0) {
    return true;
  }

  if (!auth.hasRoleAccess(allowedRoleAccess)) {
    console.warn(`[roleGuard] User not authorized for this route - redirecting to login`);

    const redirectTo = route.data['redirectTo'] as string | undefined;
    router.navigateByUrl(redirectTo || auth.getHomeRoute());
    
    return false;
  }

  return true;
};
