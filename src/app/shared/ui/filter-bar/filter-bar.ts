import { ChangeDetectionStrategy, Component, effect, input, model, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { LucideSearch } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Responsive filter/search bar sitting above lists. The `search` model only
 * updates 300ms after the user stops typing; extra filter controls (selects,
 * date ranges, etc.) are projected in via `<ng-content />` and wrap onto new
 * lines on narrow screens instead of opening a drawer.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [LucideSearch, TranslatePipe],
  templateUrl: './filter-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar {
  readonly search = model<string>('');
  readonly searchPlaceholderKey = input('common.search');
  readonly clear = output<void>();

  /** Raw, un-debounced value bound to the text field. */
  protected readonly draft = signal(this.search());

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((value) => {
      this.search.set(value);
    });

    // Keep the draft in sync if a consumer resets `search` from the outside.
    effect(() => {
      const value = this.search();
      if (value !== this.draft()) {
        this.draft.set(value);
      }
    });
  }

  protected onInput(value: string): void {
    this.draft.set(value);
    this.searchInput$.next(value);
  }

  protected onClear(): void {
    this.draft.set('');
    this.search.set('');
    this.clear.emit();
  }
}
