import { Injectable, computed, signal } from '@angular/core';
import { AccountRoleDto } from '@core/api/dto/auth.dto';
import { UserRole } from '@core/models';
import { maskEmail, maskPhone } from './mask.util';

export type VerificationChannel = 'email' | 'sms';

/**
 * Both journeys are identical up to the final step: prove you control the
 * address, then set a password. `reset` replaces a forgotten one; `activate`
 * sets the first one on a pending account and additionally records consent.
 * The legacy portal ran both through the same `slideMode` component, branching
 * on a `mode` query param.
 */
export type ResetIntent = 'reset' | 'activate';

/**
 * State carried across the four password-reset steps.
 *
 * The legacy flow passed every field through query params — including the
 * value the OTP was checked against — so the whole reset was replayable from
 * a URL. Here the state lives in a service provided by the parent route, so it
 * exists only for the duration of the flow and never reaches the address bar.
 * Navigating away or reloading drops it, and `passwordResetStepGuard` sends the
 * user back to step one rather than showing a half-initialised step.
 */
@Injectable()
export class PasswordResetFlow {
  /** Set by the parent route from its `data.intent`. */
  readonly intent = signal<ResetIntent>('reset');

  /** Set by step 1. */
  readonly email = signal('');
  readonly account = signal<AccountRoleDto | null>(null);

  /** Set by step 2. */
  readonly channel = signal<VerificationChannel | null>(null);
  readonly challengeId = signal<string | null>(null);

  /** Set by step 3 — the server's proof that the code was verified. */
  readonly resetToken = signal<string | null>(null);

  readonly role = computed<UserRole | null>(() => this.account()?.role ?? null);
  readonly maskedEmail = computed(() => maskEmail(this.email()));
  readonly maskedPhone = computed(() => {
    const phone = this.account()?.phone ?? '';
    return phone ? maskPhone(phone) : '';
  });

  /** True once step 1 is done — the precondition for reaching step 2. */
  readonly hasIdentity = computed(() => this.email() !== '' && this.account() !== null);
  /** True once a code has been sent — the precondition for reaching step 3. */
  readonly hasChallenge = computed(() => this.hasIdentity() && this.challengeId() !== null);
  /** True once the code was verified — the precondition for reaching step 4. */
  readonly hasResetToken = computed(() => this.resetToken() !== null);

  setIdentity(email: string, account: AccountRoleDto): void {
    this.email.set(email);
    this.account.set(account);
    // A changed identity invalidates everything downstream.
    this.channel.set(null);
    this.challengeId.set(null);
    this.resetToken.set(null);
  }

  setChallenge(channel: VerificationChannel, challengeId: string): void {
    this.channel.set(channel);
    this.challengeId.set(challengeId);
    this.resetToken.set(null);
  }

  setResetToken(token: string): void {
    this.resetToken.set(token);
  }

  /** Route of the final step for this journey, relative to the flow parent. */
  finalStep(): string {
    return this.intent() === 'activate' ? 'activate' : 'reset';
  }

  reset(): void {
    this.email.set('');
    this.account.set(null);
    this.channel.set(null);
    this.challengeId.set(null);
    this.resetToken.set(null);
  }
}
