import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { GAZA_GOVERNORATES, GazaGovernorate } from '@core/models';
import { PhoneInput } from '@shared/ui/phone-input/phone-input';
import { OnboardingFlow } from '../onboarding-flow.service';

const PHONE_PATTERN = /^\+970\d{9}$/;

/**
 * Onboarding step 3 — where the contractor is based and how they are reached.
 *
 * Replaces the legacy zipcode lookup, which called a US postal-code service to
 * derive state and city. Gaza has no equivalent postal database, so the
 * governorate is chosen directly and the area typed — no lookup to fail.
 *
 * Coordinates are captured as optional numbers so the map picker can fill them
 * later without this step blocking on it; the legacy form carried the same
 * latitude/longitude pair.
 */
@Component({
  selector: 'app-onboarding-location',
  imports: [ReactiveFormsModule, TranslatePipe, PhoneInput],
  templateUrl: './location.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingLocation {
  private readonly router = inject(Router);
  private readonly flow = inject(OnboardingFlow);

  protected readonly governorates = GAZA_GOVERNORATES;

  private readonly existing = this.flow.location();

  protected readonly form = new FormGroup({
    governorate: new FormControl<GazaGovernorate | ''>(this.existing?.governorate ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    area: new FormControl(this.existing?.area ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    streetAddress: new FormControl(this.existing?.streetAddress ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    contactPhone: new FormControl(this.existing?.contactPhone ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE_PATTERN)],
    }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { governorate, area, streetAddress, contactPhone } = this.form.getRawValue();
    this.flow.setLocation({
      governorate,
      area: area.trim(),
      streetAddress: streetAddress.trim(),
      contactPhone,
      latitude: this.existing?.latitude ?? null,
      longitude: this.existing?.longitude ?? null,
    });

    void this.router.navigate(['/auth/contractor-register/capacity']);
  }

  protected back(): void {
    void this.router.navigate(['/auth/contractor-register/identity']);
  }
}
