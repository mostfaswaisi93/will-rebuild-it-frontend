import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PasswordResetFlow } from './password-reset-flow.service';

type Step = 'method' | 'verify' | 'reset';

/**
 * Keeps the reset steps in order. Flow state is in-memory, so a reload or a
 * deep link lands on a step whose prerequisites are gone; without this the
 * page would render against empty state. Sends the user back to the furthest
 * step they have actually satisfied rather than always to step one.
 */
export const passwordResetStepGuard = (step: Step): CanActivateFn => {
  return () => {
    const flow = inject(PasswordResetFlow);
    const router = inject(Router);

    const satisfied =
      step === 'method'
        ? flow.hasIdentity()
        : step === 'verify'
          ? flow.hasChallenge()
          : flow.hasResetToken();

    if (satisfied) {
      return true;
    }

    if (step !== 'method' && flow.hasChallenge()) {
      return router.createUrlTree(['/auth/forgot-password/verify']);
    }
    if (step !== 'method' && flow.hasIdentity()) {
      return router.createUrlTree(['/auth/forgot-password/method']);
    }
    return router.createUrlTree(['/auth/forgot-password']);
  };
};
