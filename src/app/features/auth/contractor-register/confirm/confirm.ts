import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApi } from '@core/api/auth-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { UserRole } from '@core/models';
import { homeRouteForRole } from '@core/session/role-home';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { OnboardingFlow } from '../onboarding-flow.service';

/**
 * Onboarding step 4 — review everything, accept the terms, submit.
 *
 * The legacy form had a single `confirmCheckbox` with no summary above it, so
 * a contractor confirmed data they could no longer see. Showing the collected
 * values here is what makes that checkbox meaningful.
 */
@Component({
  selector: 'app-onboarding-confirm',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './confirm.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingConfirm {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly flow = inject(OnboardingFlow);

  protected readonly business = this.flow.business;
  protected readonly identity = this.flow.identity;
  protected readonly location = this.flow.location;

  protected readonly acceptedTerms = new FormControl(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);

  /** The signed-in contractor's address, or the one just registered. */
  protected readonly email = computed(() => this.session.user()?.email ?? '');

  protected submit(): void {
    this.submitted.set(true);

    if (this.acceptedTerms.invalid || this.submitting()) {
      this.acceptedTerms.markAsTouched();
      return;
    }

    const business = this.business();
    const identity = this.identity();
    const location = this.location();
    if (!business || !identity || !location) {
      // The guard should have prevented this; bail rather than post a partial
      // application.
      void this.router.navigate(['/auth/contractor-register']);
      return;
    }

    this.submitting.set(true);
    this.authApi
      .completeContractorOnboarding({
        email: this.email(),
        ...business,
        ...identity,
        ...location,
        acceptedTerms: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.submitting.set(false);
          this.session.setSession(session);
          this.flow.reset();
          this.toast.success('auth.onboarding.confirm.success');
          this.routeAfterOnboarding(session.user.role);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('auth.onboarding.confirm.failed');
        },
      });
  }

  protected back(): void {
    void this.router.navigate(['/auth/contractor-register/location']);
  }

  private routeAfterOnboarding(role: UserRole): void {
    void this.router.navigate(['/app', homeRouteForRole(role)]);
  }
}
