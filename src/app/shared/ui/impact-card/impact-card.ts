import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Small stat/impact tile, e.g. "68% funded" or "Foundation phase". The
 * caller is responsible for pre-formatting `valueLabel` (currency, percent,
 * etc.) — this component does no number formatting itself.
 */
@Component({
  selector: 'app-impact-card',
  imports: [TranslatePipe],
  templateUrl: './impact-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactCard {
  readonly labelKey = input.required<string>();
  readonly valueLabel = input.required<string>();
  readonly percent = input<number>();

  protected clampedPercent(): number {
    const value = this.percent();
    if (value === undefined) {
      return 0;
    }
    return Math.min(100, Math.max(0, value));
  }
}
