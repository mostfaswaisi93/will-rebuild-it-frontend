import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { MasterApi } from '@core/api/master-api.service';
import { Address, GAZA_GOVERNORATES, GazaGovernorate } from '@core/models';

/** Editable draft shape — `governorate` may be unset (`''`) until the user picks one, unlike `Address`. */
interface AddressDraft {
  governorate: GazaGovernorate | '';
  district: string;
  streetDescription: string;
}

const EMPTY_DRAFT: AddressDraft = { governorate: '', district: '', streetDescription: '' };

/**
 * `ControlValueAccessor` form control for `Address`: governorate + district
 * selects (district is filtered by, and disabled until, the chosen
 * governorate) plus an optional free-text street description.
 */
@Component({
  selector: 'app-address-picker',
  imports: [TranslatePipe],
  templateUrl: './address-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressPicker),
      multi: true,
    },
  ],
})
export class AddressPicker implements ControlValueAccessor {
  private readonly masterApi = inject(MasterApi);

  protected readonly uid = `address-picker-${crypto.randomUUID().slice(0, 8)}`;
  protected readonly governorates = GAZA_GOVERNORATES;

  private readonly geoAreas = toSignal(this.masterApi.getGeoAreas(), { initialValue: [] });

  protected readonly draft = signal<AddressDraft>(EMPTY_DRAFT);
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

  protected onBlur(): void {
    this.onTouched();
  }

  private emit(): void {
    const { governorate, district, streetDescription } = this.draft();
    this.onChange({
      governorate: governorate as GazaGovernorate,
      district,
      streetDescription: streetDescription || undefined,
    });
  }
}
