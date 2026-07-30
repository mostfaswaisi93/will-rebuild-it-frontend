import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideCheck, LucideCircle, LucideEye, LucideEyeOff } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

interface PasswordRule {
  key: 'length' | 'uppercase' | 'lowercase' | 'number' | 'symbol';
  test: (value: string) => boolean;
}

const RULES: PasswordRule[] = [
  { key: 'length', test: (value) => value.length >= 8 && value.length <= 15 },
  { key: 'uppercase', test: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', test: (value) => /[a-z]/.test(value) },
  { key: 'number', test: (value) => /[0-9]/.test(value) },
  { key: 'symbol', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

/**
 * `ControlValueAccessor` password input with a show/hide toggle and an
 * optional live rules checklist (`showRules`) shown while focused/dirty —
 * off by default for a plain sign-in field, on for a future signup page.
 */
@Component({
  selector: 'app-password-field',
  imports: [TranslatePipe, LucideEye, LucideEyeOff, LucideCheck, LucideCircle],
  templateUrl: './password-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordField),
      multi: true,
    },
  ],
})
export class PasswordField implements ControlValueAccessor {
  readonly labelKey = input<string>();
  readonly showRules = input(false);

  /**
   * The message describing this field's current error, and whether it is
   * showing. The error text belongs to the parent form (it knows which rule
   * broke), but `aria-describedby` has to land on the real `<input>` inside
   * this component — a screen reader reads the description of the element it
   * is on, and the host `<app-password-field>` is not focusable.
   */
  readonly errorId = input<string>();
  readonly invalid = input(false);

  protected readonly uid = `password-field-${crypto.randomUUID().slice(0, 8)}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly revealed = signal(false);
  protected readonly focused = signal(false);
  protected readonly dirty = signal(false);

  protected readonly rules = computed(() =>
    RULES.map((rule) => ({ key: rule.key, satisfied: rule.test(this.value()) })),
  );

  protected readonly showChecklist = computed(() => this.showRules() && (this.focused() || this.dirty()));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value);
    this.dirty.set(true);
    this.onChange(input.value);
  }

  protected onFocus(): void {
    this.focused.set(true);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  protected toggleReveal(): void {
    this.revealed.update((revealed) => !revealed);
  }
}
