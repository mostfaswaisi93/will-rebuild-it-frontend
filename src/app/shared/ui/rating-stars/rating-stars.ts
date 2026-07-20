import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { LucideStar } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Star rating display AND input — used both to show a team's average
 * rating read-only, and to let a beneficiary rate a team 1-5 stars.
 */
@Component({
  selector: 'app-rating-stars',
  imports: [LucideStar, TranslatePipe],
  templateUrl: './rating-stars.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingStars {
  readonly value = model<number>(0);
  readonly readonly = input(true);
  readonly max = input(5);

  protected readonly hoverValue = signal<number | null>(null);

  protected readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));

  /** Value used for the fill threshold: hover preview takes priority over the committed value. */
  protected readonly displayValue = computed(() => this.hoverValue() ?? this.value());

  protected onStarClick(star: number): void {
    if (this.readonly()) {
      return;
    }
    this.value.set(star);
  }

  protected onStarHover(star: number): void {
    if (this.readonly()) {
      return;
    }
    this.hoverValue.set(star);
  }

  protected onMouseLeave(): void {
    this.hoverValue.set(null);
  }
}
