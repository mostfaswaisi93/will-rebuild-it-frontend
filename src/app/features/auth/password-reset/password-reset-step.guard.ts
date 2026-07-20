import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { PasswordResetFlow, ResetIntent } from './password-reset-flow.service';

type Step = 'method' | 'verify' | 'reset';

/**
 * Keeps the reset steps in order. Flow state is in-memory, so a reload or a
 * deep link lands on a step whose prerequisites are gone; without this the page
 * would render against empty state. Sends the user back to the furthest step
 * they have actually satisfied rather than always to step one.
 */
export const passwordResetStepGuard = (step: Step): CanActivateFn => {
  return (route: ActivatedRouteSnapshot) => {
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

    // Read the intent from route data rather than the flow: guards run before
    // any component is instantiated, so the parent has not seeded it yet. Using
    // the flow here would bounce the activation journey to the reset URL.
    const intent = (route.parent?.data['intent'] as ResetIntent | undefined) ?? 'reset';
    const base = intent === 'activate' ? '/auth/activate' : '/auth/forgot-password';

    if (step !== 'method' && flow.hasChallenge()) {
      return router.createUrlTree([base, 'verify']);
    }
    if (step !== 'method' && flow.hasIdentity()) {
      return router.createUrlTree([base, 'method']);
    }
    return router.createUrlTree([base]);
  };
};
