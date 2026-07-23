import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  Address,
  DAMAGE_SEVERITIES,
  DamageSeverity,
  PROPERTY_TYPES,
  PropertyType,
  REQUEST_TYPES,
  RequestType,
} from '@core/models';
import { RequestsApi } from '@core/api/requests-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { AddressPicker } from '@shared/ui/address-picker/address-picker';
import { PageHeader } from '@shared/ui/page-header/page-header';

const EMPTY_ADDRESS: Address = { governorate: 'gazaCity', district: '' };

/**
 * Report damaged property — the beneficiary's own entry point into the
 * platform, and the self-service counterpart to the operator-logged
 * `/app/work-requests/new`. Posts to `submitDamageReport`, which files it for
 * review; matching a team is an operator decision, so nothing here picks one.
 */
@Component({
  selector: 'app-request-new',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, AddressPicker],
  templateUrl: './request-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestNew {
  private readonly api = inject(RequestsApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly types = REQUEST_TYPES;
  protected readonly propertyTypes = PROPERTY_TYPES;
  protected readonly severities = DAMAGE_SEVERITIES;

  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  private readonly user = this.session.user();

  protected readonly form = this.fb.nonNullable.group({
    type: ['assessment' as RequestType, Validators.required],
    propertyType: ['residential' as PropertyType, Validators.required],
    severity: ['partial' as DamageSeverity, Validators.required],
    address: [EMPTY_ADDRESS, Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    contactName: [this.user ? `${this.user.firstName} ${this.user.lastName}` : '', Validators.required],
    contactPhone: [this.user?.phone ?? '', Validators.required],
  });

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.submitted.set(true);
    this.form.markAllAsTouched();

    const address = this.form.controls.address.value;
    if (this.form.invalid || !address?.governorate || !address.district) {
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .submitDamageReport({
        type: raw.type,
        propertyType: raw.propertyType,
        severity: raw.severity,
        description: raw.description.trim(),
        address: raw.address,
        contactName: raw.contactName.trim(),
        contactPhone: raw.contactPhone.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (request) => {
          this.saving.set(false);
          this.toast.success('requests.new.submitted');
          void this.router.navigate(['/app/requests', request.id]);
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  /** The address control is a CVA, so its own emptiness needs checking here. */
  protected addressMissing(): boolean {
    const address = this.form.controls.address.value;
    return this.submitted() && (!address?.governorate || !address.district);
  }
}
