import { UserRole } from '@core/models';

/**
 * Landing route for a role, shared by `roleGuard` (where to bounce someone who
 * hit a route their role can't see) and sign-in (where to send them after
 * authenticating). Keeping one table avoids the two drifting apart.
 */
export function homeRouteForRole(role: UserRole | null): string {
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
