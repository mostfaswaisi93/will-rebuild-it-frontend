import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { BUSINESS_TYPES, BusinessType, CONTRACTOR_TRADES, ContractorTrade } from '@core/models';
import { OnboardingFlow } from '../onboarding-flow.service';

/**
 * Onboarding step 1 — the business itself.
 *
 * `registrationNumber` is conditionally required: a sole trader has no
 * commercial registration, but every other legal form does. The legacy form
 * marked the equivalent field required for everyone, so sole traders had to
 * invent a value to get past it.
 */
@Component({
  selector: 'app-onboarding-business',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './business.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingBusiness {
  private readonly router = inject(Router);
  private readonly flow = inject(OnboardingFlow);

  protected readonly businessTypes = BUSINESS_TYPES;
  protected readonly allTrades = CONTRACTOR_TRADES;

  private readonly existing = this.flow.business();

  protected readonly form = new FormGroup({
    businessName: new FormControl(this.existing?.businessName ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    businessType: new FormControl<BusinessType | ''>(this.existing?.businessType ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    registrationNumber: new FormControl(this.existing?.registrationNumber ?? '', {
      nonNullable: true,
    }),
  });

  /** Multi-select, so it lives beside the form rather than in it. */
  protected readonly trades = signal<ReadonlySet<ContractorTrade>>(
    new Set(this.existing?.trades ?? []),
  );

  protected readonly submitted = signal(false);

  private readonly businessType = toSignal(
    this.form.controls.businessType.valueChanges.pipe(
      startWith(this.form.controls.businessType.value),
    ),
    { initialValue: '' as BusinessType | '' },
  );

  protected readonly registrationRequired = computed(() => {
    const type = this.businessType();
    return type !== '' && type !== 'soleTrader';
  });

  protected readonly tradesInvalid = computed(() => this.trades().size === 0);

  protected isTradeSelected(trade: ContractorTrade): boolean {
    return this.trades().has(trade);
  }

  protected toggleTrade(trade: ContractorTrade): void {
    const next = new Set(this.trades());
    if (!next.delete(trade)) {
      next.add(trade);
    }
    this.trades.set(next);
  }

  protected submit(): void {
    this.submitted.set(true);

    const registration = this.form.controls.registrationNumber;
    registration.setValidators(this.registrationRequired() ? [Validators.required] : []);
    registration.updateValueAndValidity();

    if (this.form.invalid || this.tradesInvalid()) {
      this.form.markAllAsTouched();
      return;
    }

    const { businessName, businessType, registrationNumber } = this.form.getRawValue();
    this.flow.setBusiness({
      businessName: businessName.trim(),
      businessType,
      registrationNumber: registrationNumber.trim(),
      trades: [...this.trades()],
    });

    void this.router.navigate(['/auth/contractor-register/identity']);
  }
}
