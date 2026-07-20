import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideCircleCheckBig } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Registration confirmation — port of the legacy `TopprozConfirmationComponent`.
 *
 * Confirms the account exists, states the sign-in address and the contractor
 * reference, and sends the user on to complete their profile. The legacy page
 * branched its single "Proceed" button on a `mode` route param (`VANLYNK` vs
 * `LEADGEN`) to pick between two wizards; there is one onboarding wizard here,
 * so the branch is gone.
 */
@Component({
  selector: 'app-registered',
  imports: [RouterLink, TranslatePipe, LucideCircleCheckBig],
  templateUrl: './registered.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registered {
  private readonly route = inject(ActivatedRoute);

  /** Both come from the registration response; neither is sensitive. */
  protected readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  protected readonly reference = this.route.snapshot.queryParamMap.get('ref') ?? '';
}
