import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { OnboardingFlow } from './onboarding-flow.service';

/**
 * Shell for contractor onboarding — the profile a registered contractor must
 * complete before sign-in will let them in.
 *
 * `OnboardingFlow` is provided on the route (see `app.routes.ts`) rather than
 * here, because the step guards resolve it before any component exists.
 */
@Component({
  selector: 'app-contractor-register',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './contractor-register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractorRegister {
  protected readonly flow = inject(OnboardingFlow);

  protected readonly steps = [1, 2, 3, 4];

  protected readonly currentStep = computed(() => {
    if (this.flow.hasLocation()) {
      return 4;
    }
    if (this.flow.hasIdentity()) {
      return 3;
    }
    if (this.flow.hasBusiness()) {
      return 2;
    }
    return 1;
  });
}
