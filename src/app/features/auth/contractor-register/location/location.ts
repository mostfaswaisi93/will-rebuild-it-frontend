import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { GAZA_GOVERNORATES, GOVERNORATE_CENTROIDS, GazaGovernorate } from '@core/models';
import { MapMarker, MapView } from '@shared/ui/map/map';
import { PhoneInput } from '@shared/ui/phone-input/phone-input';
import { OnboardingFlow } from '../onboarding-flow.service';

const PHONE_PATTERN = /^\+970\d{9}$/;

/**
 * Onboarding step 3 — where the contractor is based, where they will work, and
 * how they are reached.
 *
 * Replaces two legacy pieces:
 *  - the zipcode lookup, which called a US postal service to derive state and
 *    city. Gaza has no equivalent database, so the governorate is chosen
 *    directly and the area typed — no lookup to fail.
 *  - `map1`'s service-area picker, ~2,000 lines of US county/ZIP GeoJSON
 *    wrangling (`getCountyManualy`, `insertCountiesZipcodeBatch`, …) needed to
 *    resolve ~3,000 counties. Gaza has five governorates, so coverage is a
 *    plain multi-select and the map is confirmation rather than the input.
 */
@Component({
  selector: 'app-onboarding-location',
  imports: [ReactiveFormsModule, TranslatePipe, PhoneInput, MapView],
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

  protected readonly served = signal<ReadonlySet<GazaGovernorate>>(
    new Set(this.existing?.servedGovernorates ?? []),
  );

  protected readonly submitted = signal(false);

  private readonly homeGovernorate = toSignal(
    this.form.controls.governorate.valueChanges.pipe(
      startWith(this.form.controls.governorate.value),
    ),
    { initialValue: '' as GazaGovernorate | '' },
  );

  /** Centre the map on the home governorate once one is chosen. */
  protected readonly mapCenter = computed(() => {
    const home = this.homeGovernorate();
    return home ? GOVERNORATE_CENTROIDS[home] : { lat: 31.4, lng: 34.35 };
  });

  protected readonly mapMarkers = computed<MapMarker[]>(() =>
    [...this.served()].map((governorate) => ({
      id: governorate,
      lat: GOVERNORATE_CENTROIDS[governorate].lat,
      lng: GOVERNORATE_CENTROIDS[governorate].lng,
    })),
  );

  protected readonly servedInvalid = computed(() => this.served().size === 0);

  constructor() {
    // A contractor necessarily serves the governorate they are based in;
    // selecting it implicitly saves a step and prevents an incoherent profile.
    effect(() => {
      const home = this.homeGovernorate();
      if (!home) {
        return;
      }
      untracked(() => {
        if (!this.served().has(home)) {
          this.served.set(new Set([...this.served(), home]));
        }
      });
    });
  }

  protected isServed(governorate: GazaGovernorate): boolean {
    return this.served().has(governorate);
  }

  /** The home governorate cannot be deselected — see the effect above. */
  protected isLocked(governorate: GazaGovernorate): boolean {
    return this.homeGovernorate() === governorate;
  }

  protected toggleServed(governorate: GazaGovernorate): void {
    if (this.isLocked(governorate)) {
      return;
    }
    const next = new Set(this.served());
    if (!next.delete(governorate)) {
      next.add(governorate);
    }
    this.served.set(next);
  }

  protected submit(): void {
    this.submitted.set(true);

    if (this.form.invalid || this.servedInvalid()) {
      this.form.markAllAsTouched();
      return;
    }

    const { governorate, area, streetAddress, contactPhone } = this.form.getRawValue();
    const centroid = governorate ? GOVERNORATE_CENTROIDS[governorate] : null;

    this.flow.setLocation({
      governorate,
      area: area.trim(),
      streetAddress: streetAddress.trim(),
      contactPhone,
      servedGovernorates: [...this.served()],
      // Coverage is recorded per governorate, so the centroid is the honest
      // resolution here — not a false-precision pin the user never placed.
      latitude: centroid?.lat ?? null,
      longitude: centroid?.lng ?? null,
    });

    void this.router.navigate(['/auth/contractor-register/capacity']);
  }

  protected back(): void {
    void this.router.navigate(['/auth/contractor-register/identity']);
  }
}
