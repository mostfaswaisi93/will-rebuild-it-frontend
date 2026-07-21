import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  DAMAGE_SEVERITIES,
  DamageSeverity,
  GAZA_GOVERNORATES,
  GazaGovernorate,
  PROPERTY_TYPES,
  PropertyType,
  REQUEST_TYPES,
  RequestType,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { WorkRequestsApi } from '@core/api/work-requests-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { PhoneInput } from '@shared/ui/phone-input/phone-input';

const PHONE_PATTERN = /^\+970\d{9}$/;

/**
 * Log a reconstruction request on a beneficiary's behalf — port of the legacy
 * `add-new-job`.
 *
 * The legacy version was a four-form, jQuery-scrolled funnel (email check →
 * service category → description → address) built for a self-service customer
 * who might not exist yet. Here the actor is an operator who already has the
 * beneficiary on the phone, so it is one flat form: contact, what and where,
 * the damage, a description. The created request carries `origin:
 * 'directBooking'` so it is distinguishable from the self-service funnel.
 */
@Component({
  selector: 'app-work-request-new',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, PhoneInput],
  templateUrl: './work-request-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkRequestNew {
  private readonly api = inject(WorkRequestsApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly types = REQUEST_TYPES;
  protected readonly propertyTypes = PROPERTY_TYPES;
  protected readonly severities = DAMAGE_SEVERITIES;
  protected readonly governorates = GAZA_GOVERNORATES;

  protected readonly submitting = signal(false);

  protected readonly form = new FormGroup({
    contactName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contactPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE_PATTERN)],
    }),
    type: new FormControl<RequestType>('reconstruction', { nonNullable: true }),
    propertyType: new FormControl<PropertyType>('residential', { nonNullable: true }),
    severity: new FormControl<DamageSeverity>('severe', { nonNullable: true }),
    governorate: new FormControl<GazaGovernorate | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    district: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    streetDescription: new FormControl('', { nonNullable: true }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(1000)],
    }),
  });

  protected submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);

    this.api
      .create({
        contactName: value.contactName.trim(),
        contactPhone: value.contactPhone,
        type: value.type,
        propertyType: value.propertyType,
        severity: value.severity,
        // Required-validated above, so it is a real governorate by here.
        governorate: value.governorate as GazaGovernorate,
        district: value.district.trim(),
        streetDescription: value.streetDescription.trim(),
        description: value.description.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (request) => {
          this.submitting.set(false);
          this.toast.success('workRequests.new.created', { number: request.requestNumber });
          void this.router.navigate(['/app/work-requests', request.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected cancel(): void {
    void this.router.navigate(['/app/work-requests']);
  }
}
