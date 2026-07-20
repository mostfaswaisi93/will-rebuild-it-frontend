import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideMail, LucideSmartphone } from '@lucide/angular';
import { AuthApi } from '@core/api/auth-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { PasswordResetFlow, VerificationChannel } from '../password-reset-flow.service';

/**
 * Reset step 2 — port of the legacy `FrgtPswdModeSelection` slide: pick whether
 * the one-time code arrives by email or SMS. Both destinations are shown masked.
 */
@Component({
  selector: 'app-password-reset-method',
  imports: [TranslatePipe, LucideMail, LucideSmartphone],
  templateUrl: './method.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetMethod {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly flow = inject(PasswordResetFlow);

  protected readonly channel = signal<VerificationChannel>(this.flow.channel() ?? 'email');
  protected readonly sending = signal(false);

  /** SMS is only offered when the account actually carries a phone number. */
  protected readonly smsAvailable = computed(() => this.flow.maskedPhone() !== '');

  protected select(channel: VerificationChannel): void {
    if (channel === 'sms' && !this.smsAvailable()) {
      return;
    }
    this.channel.set(channel);
  }

  protected submit(): void {
    const role = this.flow.role();
    if (!role || this.sending()) {
      return;
    }

    const channel = this.channel();
    this.sending.set(true);

    this.authApi
      .sendVerificationCode(this.flow.email(), channel, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ challengeId }) => {
          this.sending.set(false);
          this.flow.setChallenge(channel, challengeId);
          void this.router.navigate(['../verify'], { relativeTo: this.route });
        },
        error: () => {
          this.sending.set(false);
          this.toast.danger('auth.reset.method.sendFailed');
        },
      });
  }

  protected back(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }
}
