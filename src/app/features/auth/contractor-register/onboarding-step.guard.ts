import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OnboardingFlow } from './onboarding-flow.service';

type Step = 'identity' | 'location' | 'confirm';

const BASE = '/auth/contractor-register';

/**
 * Keeps the onboarding steps in order, and sends a user who deep-links or
 * reloads back to the furthest step they have actually completed rather than
 * rendering a later step against empty state.
 */
export const onboardingStepGuard = (step: Step): CanActivateFn => {
  return () => {
    const flow = inject(OnboardingFlow);
    const router = inject(Router);

    const satisfied =
      step === 'identity'
        ? flow.hasBusiness()
        : step === 'location'
          ? flow.hasIdentity()
          : flow.hasLocation();

    if (satisfied) {
      return true;
    }

    if (flow.hasIdentity()) {
      return router.createUrlTree([BASE, 'location']);
    }
    if (flow.hasBusiness()) {
      return router.createUrlTree([BASE, 'identity']);
    }
    return router.createUrlTree([BASE]);
  };
};
