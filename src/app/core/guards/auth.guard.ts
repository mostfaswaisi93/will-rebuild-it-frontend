import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../session/session-store.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    return true;
  }

  // Sign-in is the pre-auth entry point in this rebuild; the legacy portal's
  // separate `/pub/email-check/request` step is folded into it (the sign-in
  // form resolves the email to its role accounts before asking for a password).
  return router.createUrlTree(['/auth/sign-in'], {
    queryParams: { returnUrl: state.url },
  });
};
