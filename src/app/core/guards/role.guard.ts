import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@core/models';
import { SessionStore } from '../session/session-store.service';

/** Usage: `{ path: 'donations', canActivate: [roleGuard(['donor'])], ... }` */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const session = inject(SessionStore);
    const router = inject(Router);
    const role = session.role();

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    return router.createUrlTree(['/app', homeRouteForRole(role)]);
  };
};

function homeRouteForRole(role: UserRole | null): string {
  switch (role) {
    case 'donor':
      return 'donations';
    case 'team':
      return 'team-dashboard';
    case 'admin':
      return 'admin-dashboard';
    case 'contractor':
      return 'contractor-dashboard';
    case 'staff':
      return 'staff-dashboard';
    case 'supplier':
      return 'supplier-dashboard';
    case 'beneficiary':
    default:
      return 'dashboard';
  }
}
