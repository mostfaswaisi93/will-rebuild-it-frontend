import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { OnboardingFlow } from '../onboarding-flow.service';

const CURRENT_YEAR = new Date().getFullYear();
/** Nothing in Gaza's contracting sector predates this meaningfully. */
const EARLIEST_FOUNDED_YEAR = 1900;

/**
 * Onboarding step 5 — capacity. Ports the legacy `employeesForm`,
 * `fieldServiceForm`, `startBusinessForm` and `generalForm`, which were four
 * separate `FormGroup`s driving four panels of the same screen.
 *
 * `vehicleCount` is the legacy `noOftrucks` widened past trucks: excavators,
 * loaders and mixers are what matters for reconstruction capacity.
 */
@Component({
  selector: 'app-onboarding-capacity',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './capacity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingCapacity {
  private readonly router = inject(Router);
  private readonly flow = inject(OnboardingFlow);

  protected readonly currentYear = CURRENT_YEAR;
  protected readonly earliestYear = EARLIEST_FOUNDED_YEAR;

  private readonly existing = this.flow.capacity();

  protected readonly form = new FormGroup({
    employeeCount: new FormControl<number | null>(this.existing?.employeeCount ?? null, {
      validators: [Validators.required, Validators.min(1), Validators.max(10000)],
    }),
    // Legacy defaulted to 1; a contractor with no machinery of their own is a
    // real case, so 0 is allowed.
    vehicleCount: new FormControl<number | null>(this.existing?.vehicleCount ?? null, {
      validators: [Validators.required, Validators.min(0), Validators.max(10000)],
    }),
    foundedYear: new FormControl<number | null>(this.existing?.foundedYear ?? null, {
      validators: [
        Validators.required,
        Validators.min(EARLIEST_FOUNDED_YEAR),
        Validators.max(CURRENT_YEAR),
      ],
    }),
    summary: new FormControl(this.existing?.summary ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(600)],
    }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { employeeCount, vehicleCount, foundedYear, summary } = this.form.getRawValue();
    this.flow.setCapacity({
      employeeCount,
      vehicleCount,
      foundedYear,
      summary: summary.trim(),
    });

    void this.router.navigate(['/auth/contractor-register/credentials']);
  }

  protected back(): void {
    void this.router.navigate(['/auth/contractor-register/location']);
  }
}
