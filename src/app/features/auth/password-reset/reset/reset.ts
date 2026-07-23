import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApi } from '@core/api/auth-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { UserRole } from '@core/models';
import { homeRouteForRole } from '@core/session/role-home';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PasswordField } from '@shared/ui/password-field/password-field';
import { mustMatch, passwordStrengthValidator } from '@shared/validators/password.validators';
import { PasswordResetFlow } from '../password-reset-flow.service';

/**
 * Reset step 4 — port of the legacy `PswConfirmationPage` slide. On success the
 * API returns a session, so the user lands signed in rather than being bounced
 * back to sign-in to retype the password they just chose (which is what the
 * legacy flow did, via a second login call).
 */
@Component({
  selector: 'app-password-reset-reset',
  imports: [ReactiveFormsModule, TranslatePipe, PasswordField],
  templateUrl: './reset.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetReset {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly flow = inject(PasswordResetFlow);

  protected readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordStrengthValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: mustMatch('password', 'confirmPassword') },
  );

  protected readonly submitting = signal(false);

  protected submit(): void {
    const resetToken = this.flow.resetToken();
    if (!resetToken || this.submitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authApi
      .resetPassword(resetToken, this.form.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.submitting.set(false);
          this.session.setSession(session);
          this.flow.reset();
          this.toast.success('auth.reset.reset.success');
          this.routeAfterReset(session.user.role);
        },
        error: () => {
          this.submitting.set(false);
          // The likeliest cause is an expired reset token, which is only
          // recoverable by requesting a fresh code.
          this.toast.danger('auth.reset.reset.failed');
        },
      });
  }

  /** Every role is served by this app — see the note in `sign-in.ts`. */
  private routeAfterReset(role: UserRole): void {
    void this.router.navigate(['/app', homeRouteForRole(role)]);
  }
}
