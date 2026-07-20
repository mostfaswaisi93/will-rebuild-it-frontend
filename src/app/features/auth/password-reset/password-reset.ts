import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PasswordResetFlow, ResetIntent } from './password-reset-flow.service';

/**
 * Parent of the reset/activate steps.
 *
 * `PasswordResetFlow` is provided on the *route* (see `app.routes.ts`), not
 * here: `canActivate` guards resolve against the route injector and run before
 * any component is instantiated, so a component-level provider would be
 * invisible to `passwordResetStepGuard`. The route injector gives the same
 * scoping — created when the flow is entered, destroyed when it is left.
 *
 * Mounted at two paths (`/auth/forgot-password` and `/auth/activate`) which
 * differ only by `data.intent`; the steps are shared.
 */
@Component({
  selector: 'app-password-reset',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './password-reset.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordReset {
  private readonly route = inject(ActivatedRoute);
  protected readonly flow = inject(PasswordResetFlow);

  private readonly routeIntent = toSignal(
    this.route.data.pipe(map((data) => (data['intent'] as ResetIntent | undefined) ?? 'reset')),
    { initialValue: 'reset' as ResetIntent },
  );

  /** Drives the step indicator; mirrors the guard's ordering. */
  protected readonly currentStep = computed(() => {
    if (this.flow.hasResetToken()) {
      return 4;
    }
    if (this.flow.hasChallenge()) {
      return 3;
    }
    if (this.flow.hasIdentity()) {
      return 2;
    }
    return 1;
  });

  protected readonly steps = [1, 2, 3, 4];

  constructor() {
    // Seed the flow from the route rather than having each step re-read it.
    this.flow.intent.set(this.routeIntent());
  }
}
