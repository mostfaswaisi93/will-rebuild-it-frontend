import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '@core/api/auth-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { PasswordField } from '@shared/ui/password-field/password-field';
import { PhoneInput } from '@shared/ui/phone-input/phone-input';
import { mustMatch, passwordStrengthValidator } from '@shared/validators/password.validators';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** `+970` followed by 9 digits — the shape `app-phone-input` emits. */
const PHONE_PATTERN = /^\+970\d{9}$/;

/**
 * Contractor account creation — port of the legacy `SignUpComponent`.
 *
 * Creates the account in a pending state; sign-in blocks it until the
 * onboarding wizard is finished, which mirrors the legacy `PRO` flags. The
 * legacy form applied a 6-character minimum here but 8-plus-complexity on
 * reset, so a password accepted at signup could not be re-entered later —
 * both now use the same rules.
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PasswordField, PhoneInput],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup(
    {
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      phone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PHONE_PATTERN)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
      }),
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
  /** Set when the API reports the address is taken, cleared on the next edit. */
  protected readonly emailTaken = signal(false);

  constructor() {
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emailTaken.set(false));
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, phone, password } = this.form.getRawValue();
    this.submitting.set(true);

    this.authApi
      .register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone,
        password,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ userId }) => {
          this.submitting.set(false);
          void this.router.navigate(['/auth/registered'], {
            queryParams: { email: email.trim(), ref: userId },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          // A taken address is a field-level problem, not a transient failure,
          // so it belongs next to the input rather than in a toast.
          if (error.status === 409) {
            this.emailTaken.set(true);
            this.form.controls.email.markAsTouched();
            return;
          }
          this.toast.danger('auth.register.failed');
        },
      });
  }
}
