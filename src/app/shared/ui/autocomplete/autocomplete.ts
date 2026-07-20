import { ChangeDetectionStrategy, Component, computed, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideSearch } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

export interface AutocompleteOption {
  id: string;
  label: string;
}

/**
 * `ControlValueAccessor` typeahead input over a caller-provided, in-memory
 * `options` list — this component does not call any API itself, keeping it
 * generic (e.g. reusable for a future header search bar). The form value is
 * the selected option's `id`; `selected` additionally emits the full option
 * object for convenience.
 */
@Component({
  selector: 'app-autocomplete',
  imports: [TranslatePipe, LucideSearch],
  templateUrl: './autocomplete.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Autocomplete),
      multi: true,
    },
  ],
})
export class Autocomplete implements ControlValueAccessor {
  readonly options = input.required<AutocompleteOption[]>();
  readonly placeholderKey = input<string>();
  readonly labelKey = input<string>();

  readonly selected = output<AutocompleteOption>();

  protected readonly uid = `autocomplete-${crypto.randomUUID().slice(0, 8)}`;
  protected readonly query = signal('');
  protected readonly isOpen = signal(false);
  protected readonly highlightedIndex = signal(-1);
  protected readonly disabled = signal(false);

  private readonly selectedId = signal<string | null>(null);

  protected readonly filteredOptions = computed(() => {
    const needle = this.query().trim().toLowerCase();
    if (!needle) {
      return [];
    }
    return this.options().filter((option) => option.label.toLowerCase().includes(needle));
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.selectedId.set(value ?? null);
    const match = this.options().find((option) => option.id === value);
    this.query.set(match?.label ?? '');
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.isOpen.set(true);
    this.highlightedIndex.set(-1);
    if (this.selectedId() !== null) {
      // Typing invalidates the previously committed selection until a new option is chosen.
      this.selectedId.set(null);
      this.onChange(null);
    }
  }

  protected onFocus(): void {
    if (this.query().trim()) {
      this.isOpen.set(true);
    }
  }

  protected onBlur(): void {
    // Delayed close so a click/mousedown on a listbox option can register first.
    setTimeout(() => this.isOpen.set(false), 150);
    this.onTouched();
  }

  protected selectOption(option: AutocompleteOption): void {
    this.selectedId.set(option.id);
    this.query.set(option.label);
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
    this.onChange(option.id);
    this.selected.emit(option);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.filteredOptions();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
          return;
        }
        this.highlightedIndex.update((index) => (items.length ? (index + 1) % items.length : -1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
          return;
        }
        this.highlightedIndex.update((index) => (items.length ? (index - 1 + items.length) % items.length : -1));
        break;
      case 'Enter': {
        const index = this.highlightedIndex();
        if (this.isOpen() && index >= 0 && items[index]) {
          event.preventDefault();
          this.selectOption(items[index]);
        }
        break;
      }
      case 'Escape':
        this.isOpen.set(false);
        this.highlightedIndex.set(-1);
        break;
      default:
        break;
    }
  }
}
