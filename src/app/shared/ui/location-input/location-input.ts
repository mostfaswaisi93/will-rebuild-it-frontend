import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { MasterApi } from '@core/api/master-api.service';
import { Address, GAZA_GOVERNORATES, GazaGovernorate } from '@core/models';

/** Editable draft shape — `governorate`/coordinates may be unset until the user fills them in. */
interface LocationDraft {
  governorate: GazaGovernorate | '';
  district: string;
  streetDescription: string;
  latitude: string;
  longitude: string;
}

const EMPTY_DRAFT: LocationDraft = {
  governorate: '',
  district: '',
  streetDescription: '',
  latitude: '',
  longitude: '',
};

/**
 * `ControlValueAccessor` form control for the full `Address` shape,
 * including optional `latitude`/`longitude`. Intended for contexts that need
 * explicit coordinates alongside governorate/district — e.g. a future
 * damage-report wizard — without embedding a live map (no map component
 * exists in this batch). Deliberately overlaps `AddressPicker`; kept as a
 * separate component per the product spec rather than unified into one
 * over-parameterized control.
 */
@Component({
  selector: 'app-location-input',
  imports: [TranslatePipe],
  templateUrl: './location-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationInput),
      multi: true,
    },
  ],
})
export class LocationInput implements ControlValueAccessor {
  private readonly masterApi = inject(MasterApi);

  protected readonly uid = `location-input-${crypto.randomUUID().slice(0, 8)}`;
  protected readonly governorates = GAZA_GOVERNORATES;

  private readonly geoAreas = toSignal(this.masterApi.getGeoAreas(), { initialValue: [] });

  protected readonly draft = signal<LocationDraft>(EMPTY_DRAFT);
  protected readonly disabled = signal(false);

  protected readonly districts = computed(() => {
    const governorate = this.draft().governorate;
    if (!governorate) {
      return [];
    }
    const names = this.geoAreas()
      .filter((area) => area.governorate === governorate)
      .map((area) => area.district);
    return Array.from(new Set(names));
  });

  private onChange: (value: Address) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Address | null): void {
    this.draft.set(
      value
        ? {
            governorate: value.governorate,
            district: value.district,
            streetDescription: value.streetDescription ?? '',
            latitude: value.latitude !== undefined ? String(value.latitude) : '',
            longitude: value.longitude !== undefined ? String(value.longitude) : '',
          }
        : EMPTY_DRAFT,
    );
  }

  registerOnChange(fn: (value: Address) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onGovernorateChange(raw: string): void {
    const governorate = raw as GazaGovernorate;
    this.draft.set({ ...this.draft(), governorate, district: '' });
    this.emit();
  }

  protected onDistrictChange(district: string): void {
    this.draft.set({ ...this.draft(), district });
    this.emit();
  }

  protected onStreetDescriptionChange(streetDescription: string): void {
    this.draft.set({ ...this.draft(), streetDescription });
    this.emit();
  }

  protected onLatitudeChange(latitude: string): void {
    this.draft.set({ ...this.draft(), latitude });
    this.emit();
  }

  protected onLongitudeChange(longitude: string): void {
    this.draft.set({ ...this.draft(), longitude });
    this.emit();
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private emit(): void {
    const { governorate, district, streetDescription, latitude, longitude } = this.draft();
    this.onChange({
      governorate: governorate as GazaGovernorate,
      district,
      streetDescription: streetDescription || undefined,
      latitude: latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== '' ? Number(longitude) : undefined,
    });
  }
}
