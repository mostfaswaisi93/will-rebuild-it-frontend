import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { dateOfBirthValidator, nationalIdValidator } from '@shared/validators/identity.validators';
import { OnboardingFlow } from '../onboarding-flow.service';

/**
 * Onboarding step 2 — who is behind the business.
 *
 * Ports the legacy `socialSecurity` + `dob` pair. The legacy field accepted a
 * US SSN or EIN unvalidated; this checks the national ID's check digit, so a
 * mistyped number is caught here rather than when a disbursement later fails.
 */
@Component({
  selector: 'app-onboarding-identity',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './identity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingIdentity {
  private readonly router = inject(Router);
  private readonly flow = inject(OnboardingFlow);

  private readonly existing = this.flow.identity();

  protected readonly form = new FormGroup({
    nationalId: new FormControl(this.existing?.nationalId ?? '', {
      nonNullable: true,
      validators: [Validators.required, nationalIdValidator],
    }),
    dateOfBirth: new FormControl(this.existing?.dateOfBirth ?? '', {
      nonNullable: true,
      validators: [Validators.required, dateOfBirthValidator()],
    }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nationalId, dateOfBirth } = this.form.getRawValue();
    this.flow.setIdentity({ nationalId: nationalId.trim(), dateOfBirth });
    void this.router.navigate(['/auth/contractor-register/location']);
  }

  protected back(): void {
    void this.router.navigate(['/auth/contractor-register']);
  }
}
