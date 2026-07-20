import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@core/models';
import { SessionStore } from '../session/session-store.service';
import { homeRouteForRole } from '../session/role-home';

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
