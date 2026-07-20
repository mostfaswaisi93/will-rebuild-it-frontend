import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucidePlus, LucideTrash2 } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { futureDateValidator } from '@shared/validators/date.validators';
import { TradeLicence } from '../onboarding-flow.service';
import { OnboardingFlow } from '../onboarding-flow.service';

function licenceGroup(licence?: TradeLicence) {
  return new FormGroup({
    name: new FormControl(licence?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    number: new FormControl(licence?.number ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    expiresOn: new FormControl(licence?.expiresOn ?? '', {
      nonNullable: true,
      validators: [Validators.required, futureDateValidator()],
    }),
  });
}

/**
 * Onboarding step 6 — licences and assurances. Ports the legacy
 * `addTradeLicenseList` FormArray plus `insuredForm`'s five Yes/No flags, which
 * were stored as the strings 'Yes'/'No' and compared by string throughout.
 */
@Component({
  selector: 'app-onboarding-credentials',
  imports: [ReactiveFormsModule, TranslatePipe, LucidePlus, LucideTrash2],
  templateUrl: './credentials.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingCredentials {
  private readonly router = inject(Router);
  private readonly flow = inject(OnboardingFlow);

  private readonly existing = this.flow.credentials();

  protected readonly licences = new FormArray(
    (this.existing?.licences ?? [undefined]).map((licence) => licenceGroup(licence)),
  );

  protected readonly form = new FormGroup({
    licences: this.licences,
    isInsured: new FormControl(this.existing?.isInsured ?? false, { nonNullable: true }),
    hasPerformanceBond: new FormControl(this.existing?.hasPerformanceBond ?? false, {
      nonNullable: true,
    }),
    offersWarranty: new FormControl(this.existing?.offersWarranty ?? false, { nonNullable: true }),
    freeEstimates: new FormControl(this.existing?.freeEstimates ?? false, { nonNullable: true }),
    acceptsBankTransfer: new FormControl(this.existing?.acceptsBankTransfer ?? false, {
      nonNullable: true,
    }),
  });

  protected addLicence(): void {
    this.licences.push(licenceGroup());
  }

  protected removeLicence(index: number): void {
    // At least one licence is required to operate, so never remove the last.
    if (this.licences.length > 1) {
      this.licences.removeAt(index);
    }
  }

  protected get canRemove(): boolean {
    return this.licences.length > 1;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.flow.setCredentials({
      licences: value.licences.map((licence) => ({
        name: licence.name.trim(),
        number: licence.number.trim(),
        expiresOn: licence.expiresOn,
      })),
      isInsured: value.isInsured,
      hasPerformanceBond: value.hasPerformanceBond,
      offersWarranty: value.offersWarranty,
      freeEstimates: value.freeEstimates,
      acceptsBankTransfer: value.acceptsBankTransfer,
    });

    void this.router.navigate(['/auth/contractor-register/confirm']);
  }

  protected back(): void {
    void this.router.navigate(['/auth/contractor-register/capacity']);
  }
}
