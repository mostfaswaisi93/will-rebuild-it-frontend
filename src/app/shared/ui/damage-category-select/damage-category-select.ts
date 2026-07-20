import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PROPERTY_TYPES, PropertyType } from '@core/models';

/**
 * `ControlValueAccessor` for `PropertyType`. Rendered as a labeled set of
 * selectable cards (`role="radiogroup"` / `role="radio"`) rather than a
 * plain `<select>` — this is a small, important, low-cardinality choice that
 * should be fully visible at a glance, not hidden behind a dropdown.
 */
@Component({
  selector: 'app-damage-category-select',
  imports: [TranslatePipe],
  templateUrl: './damage-category-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DamageCategorySelect),
      multi: true,
    },
  ],
})
export class DamageCategorySelect implements ControlValueAccessor {
  /** Optional visible label rendered above the group; falls back to an aria-label only if omitted. */
  readonly labelKey = input<string>();

  protected readonly uid = `damage-category-select-${crypto.randomUUID().slice(0, 8)}`;
  protected readonly options = PROPERTY_TYPES;
  protected readonly value = signal<PropertyType | null>(null);
  protected readonly disabled = signal(false);

  private readonly optionButtons = viewChildren<ElementRef<HTMLButtonElement>>('optionButton');

  private onChange: (value: PropertyType | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: PropertyType | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: PropertyType | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected select(option: PropertyType): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(option);
    this.onChange(option);
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const items = this.options;
    let nextIndex: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(items[nextIndex]);
    this.optionButtons()[nextIndex]?.nativeElement.focus();
  }
}
