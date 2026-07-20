import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Self-contained OTP entry mini-flow — not a `ControlValueAccessor`, just a
 * `model()`-based widget. Renders `length()` single-digit boxes that
 * concatenate into `code`, plus a "resend code" button with a live cooldown
 * countdown. The parent owns actually calling the resend API (`resend`
 * output) and the verify API (reads `code()`).
 */
@Component({
  selector: 'app-otp-verification-step',
  imports: [TranslatePipe],
  templateUrl: './otp-verification-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpVerificationStep {
  private readonly destroyRef = inject(DestroyRef);

  readonly code = model<string>('');
  readonly length = input(6);
  readonly resendCooldownSeconds = input(30);
  readonly resend = output<void>();

  protected readonly boxValues = signal<string[]>(this.padToLength('', this.length()));
  protected readonly secondsRemaining = signal(0);

  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('otpBox');
  private intervalId: ReturnType<typeof setInterval> | undefined;

  constructor() {
    // Keep boxValues in sync when the parent sets `code` externally (e.g. a
    // form reset). Internal edits also write through `code`, but by the time
    // this runs `boxValues` already matches, so it's a no-op then.
    effect(() => {
      const external = this.code();
      const current = this.boxValues().join('');
      if (external !== current) {
        this.boxValues.set(this.padToLength(external, this.length()));
      }
    });

    this.startCooldown();
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  protected onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const char = input.value.replace(/\D/g, '').slice(-1);
    input.value = char;
    const next = this.boxValues().slice();
    next[index] = char;
    this.commit(next);
    if (char && index < this.length() - 1) {
      this.boxes()[index + 1]?.nativeElement.focus();
    }
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.boxValues()[index] && index > 0) {
        event.preventDefault();
        const next = this.boxValues().slice();
        next[index - 1] = '';
        this.commit(next);
        this.boxes()[index - 1]?.nativeElement.focus();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.boxes()[index - 1]?.nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      event.preventDefault();
      this.boxes()[index + 1]?.nativeElement.focus();
    }
  }

  protected onPaste(event: ClipboardEvent, index: number): void {
    if (index !== 0) {
      return;
    }
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, this.length());
    if (!digits) {
      return;
    }
    event.preventDefault();
    this.commit(this.padToLength(digits, this.length()));
    const lastIndex = Math.max(0, Math.min(digits.length, this.length()) - 1);
    queueMicrotask(() => this.boxes()[lastIndex]?.nativeElement.focus());
  }

  protected requestResend(): void {
    if (this.secondsRemaining() > 0) {
      return;
    }
    this.resend.emit();
    this.startCooldown();
  }

  private commit(next: string[]): void {
    this.boxValues.set(next);
    this.code.set(next.join(''));
  }

  private padToLength(value: string, length: number): string[] {
    const chars = value.replace(/\D/g, '').slice(0, length).split('');
    return Array.from({ length }, (_, i) => chars[i] ?? '');
  }

  private startCooldown(): void {
    this.clearTimer();
    this.secondsRemaining.set(this.resendCooldownSeconds());
    this.intervalId = setInterval(() => {
      this.secondsRemaining.update((seconds) => {
        if (seconds <= 1) {
          this.clearTimer();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
