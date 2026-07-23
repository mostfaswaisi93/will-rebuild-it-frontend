import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BeneficiaryProfile } from '@core/models';
import { ProfileApi } from '@core/api/profile-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { PasswordField } from '@shared/ui/password-field/password-field';

/**
 * The signed-in user's own profile, reachable from the header menu on every
 * role. Identity fields come from the session (authoritative for all seven
 * roles); the beneficiary-only extras — household size and property address —
 * come from the profile endpoint and are shown only for that role.
 */
@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe, PageHeader, PasswordField],
  templateUrl: './profile-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly api = inject(ProfileApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly user = computed(() => this.session.user());
  protected readonly isBeneficiary = computed(() => this.session.role() === 'beneficiary');

  /** Only meaningful for a beneficiary — the endpoint models a household record. */
  private readonly profile = rxResource({
    stream: () => this.api.getProfile(),
  });

  protected readonly details = computed<BeneficiaryProfile | null>(
    () => (this.isBeneficiary() ? (this.profile.value() ?? null) : null),
  );

  protected readonly changingPassword = signal(false);
  protected readonly saving = signal(false);

  // --- Editing -------------------------------------------------------------

  /**
   * Only a beneficiary can edit here: `/profile` is a beneficiary household
   * record, so the other six roles would be patching someone else's. Their
   * identity comes from the session and is changed by an operator.
   */
  protected readonly canEdit = this.isBeneficiary;
  protected readonly editing = signal(false);
  protected readonly savingProfile = signal(false);

  /** Phone and email are deliberately absent — see `profile.contactLocked`;
   * the phone is a support-desk change, and the email is the login identity. */
  protected readonly editForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    familySize: [1, [Validators.required, Validators.min(1)]],
  });

  protected startEditing(): void {
    const profile = this.details();
    const user = this.user();
    this.editForm.setValue({
      firstName: profile?.firstName ?? user?.firstName ?? '',
      lastName: profile?.lastName ?? user?.lastName ?? '',
      familySize: profile?.familySize ?? 1,
    });
    this.editing.set(true);
  }

  protected cancelEditing(): void {
    this.editing.set(false);
  }

  protected saveProfile(): void {
    if (this.savingProfile()) {
      return;
    }
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) {
      return;
    }

    const value = this.editForm.getRawValue();
    this.savingProfile.set(true);
    this.api
      .updateProfile({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        familySize: Number(value.familySize),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.savingProfile.set(false);
          this.editing.set(false);
          this.profile.set(updated);
          this.toast.success('profile.saved');
        },
        error: () => {
          this.savingProfile.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  protected toggleChangePassword(): void {
    this.changingPassword.update((open) => !open);
    this.form.reset();
  }

  protected submitPassword(): void {
    if (this.saving()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.toast.danger('profile.changePassword.mismatch');
      return;
    }

    this.saving.set(true);
    this.api
      .changePassword(currentPassword, newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.changingPassword.set(false);
          this.form.reset();
          this.toast.success('profile.changePassword.saved');
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }
}
