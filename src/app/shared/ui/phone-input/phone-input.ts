import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PhoneMaskDirective } from '../mask-directive/phone-mask.directive';

const GAZA_DIAL_CODE = '+970';

/**
 * `ControlValueAccessor` wrapping a `type="tel"` input pre-formatted for
 * Gaza numbers: a fixed `+970` prefix label inside the field, the user only
 * types the remaining 9 digits (live-grouped by `PhoneMaskDirective`). The
 * value written to/emitted by the form control is the full `+970XXXXXXXXX`
 * string (no spaces).
 *
 * The native input is intentionally left "uncontrolled" (no `[value]`
 * binding) — its DOM value is owned by `PhoneMaskDirective` on every
 * keystroke, and this component only sets it imperatively on `writeValue`
 * (i.e. on programmatic resets), avoiding a binding/directive race on every
 * keystroke.
 */
@Component({
  selector: 'app-phone-input',
  imports: [TranslatePipe, PhoneMaskDirective],
  templateUrl: './phone-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInput),
      multi: true,
    },
  ],
})
export class PhoneInput implements ControlValueAccessor, AfterViewInit {
  readonly labelKey = input<string>();

  /**
   * See `PasswordField`: the parent form owns the error text, but the
   * description has to be attached to the `<input>` this component renders,
   * not to the non-focusable `<app-phone-input>` host.
   */
  readonly errorId = input<string>();
  readonly invalid = input(false);

  protected readonly dialCode = GAZA_DIAL_CODE;
  protected readonly uid = `phone-input-${crypto.randomUUID().slice(0, 8)}`;
  protected readonly disabled = signal(false);

  private readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('phoneNative');
  private pendingDisplayValue = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const digits = this.extractDigits(value ?? '');
    this.pendingDisplayValue = this.group(digits);
    this.applyDisplayValue();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  ngAfterViewInit(): void {
    this.applyDisplayValue();
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    this.onChange(digits ? `${GAZA_DIAL_CODE}${digits}` : '');
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private applyDisplayValue(): void {
    const el = this.nativeInput()?.nativeElement;
    if (el) {
      el.value = this.pendingDisplayValue;
    }
  }

  private extractDigits(raw: string): string {
    return raw.replace(GAZA_DIAL_CODE, '').replace(/\D/g, '').slice(0, 9);
  }

  private group(digits: string): string {
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 5);
    const part3 = digits.slice(5, 9);
    return [part1, part2, part3].filter(Boolean).join(' ');
  }
}
