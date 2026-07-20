import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApi } from '@core/api/auth-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { OtpVerificationStep } from '@shared/ui/otp-verification-step/otp-verification-step';
import { PasswordResetFlow } from '../password-reset-flow.service';

const CODE_LENGTH = 6;

/**
 * Reset step 3 — port of the legacy `FrgtPswdOTPPage` slide.
 *
 * The legacy version compared the typed code against a token the API had
 * returned in the response body, so the check was decorative: anyone could read
 * the expected value from the network tab. Verification now happens server-side
 * and returns a short-lived reset token.
 */
@Component({
  selector: 'app-password-reset-verify',
  imports: [TranslatePipe, OtpVerificationStep],
  templateUrl: './verify.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetVerify {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly flow = inject(PasswordResetFlow);

  protected readonly codeLength = CODE_LENGTH;
  protected readonly code = signal('');
  protected readonly verifying = signal(false);
  protected readonly wrongCode = signal(false);

  /** Where the code went, for the "we sent it to …" line. */
  protected readonly destination = computed(() =>
    this.flow.channel() === 'sms' ? this.flow.maskedPhone() : this.flow.maskedEmail(),
  );

  protected readonly canSubmit = computed(
    () => this.code().length === CODE_LENGTH && !this.verifying(),
  );

  protected onCodeChange(code: string): void {
    this.code.set(code);
    // Clear the previous rejection as soon as the user edits, so the error is
    // about the code they are looking at.
    if (this.wrongCode()) {
      this.wrongCode.set(false);
    }
  }

  protected submit(): void {
    const challengeId = this.flow.challengeId();
    if (!challengeId || !this.canSubmit()) {
      return;
    }

    this.verifying.set(true);
    this.authApi
      .verifyCode(challengeId, this.code())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resetToken }) => {
          this.verifying.set(false);
          this.flow.setResetToken(resetToken);
          void this.router.navigate(['../' + this.flow.finalStep()], { relativeTo: this.route });
        },
        error: () => {
          this.verifying.set(false);
          this.wrongCode.set(true);
        },
      });
  }

  protected resend(): void {
    const role = this.flow.role();
    const channel = this.flow.channel();
    if (!role || !channel) {
      return;
    }

    this.authApi
      .sendVerificationCode(this.flow.email(), channel, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ challengeId }) => {
          // A resend supersedes the previous challenge, so the id must be
          // replaced — verifying against the stale one would always fail.
          this.flow.setChallenge(channel, challengeId);
          this.code.set('');
          this.wrongCode.set(false);
          this.toast.success('auth.reset.verify.resent');
        },
        error: () => this.toast.danger('auth.reset.method.sendFailed'),
      });
  }

  protected back(): void {
    void this.router.navigate(['../method'], { relativeTo: this.route });
  }
}
