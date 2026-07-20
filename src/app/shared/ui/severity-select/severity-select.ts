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
import { DAMAGE_SEVERITIES, DamageSeverity } from '@core/models';

const SEVERITY_DOT_CLASSES: Record<DamageSeverity, string> = {
  partial: 'bg-warning',
  severe: 'bg-sand-700',
  totalLoss: 'bg-danger',
};

/**
 * `ControlValueAccessor` for `DamageSeverity`. Rendered as a labeled set of
 * selectable cards (`role="radiogroup"` / `role="radio"`), each with a small
 * severity-colored dot, rather than a plain `<select>` — this choice should
 * read unambiguously at a glance, in a high-stress reporting context.
 */
@Component({
  selector: 'app-severity-select',
  imports: [TranslatePipe],
  templateUrl: './severity-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SeveritySelect),
      multi: true,
    },
  ],
})
export class SeveritySelect implements ControlValueAccessor {
  /** Optional visible label rendered above the group; falls back to an aria-label only if omitted. */
  readonly labelKey = input<string>();

  protected readonly uid = `severity-select-${crypto.randomUUID().slice(0, 8)}`;
  protected readonly options = DAMAGE_SEVERITIES;
  protected readonly value = signal<DamageSeverity | null>(null);
  protected readonly disabled = signal(false);

  private readonly optionButtons = viewChildren<ElementRef<HTMLButtonElement>>('optionButton');

  private onChange: (value: DamageSeverity | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: DamageSeverity | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: DamageSeverity | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected dotClass(option: DamageSeverity): string {
    return SEVERITY_DOT_CLASSES[option];
  }

  protected select(option: DamageSeverity): void {
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
