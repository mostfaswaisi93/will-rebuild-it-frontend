import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon, type LucideIcon } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

export type StatTone = 'brand' | 'sand' | 'danger' | 'neutral';

/**
 * A single headline figure on a dashboard. Deliberately plain — the number is
 * the content, so it carries the visual weight and the label sits under it.
 */
@Component({
  selector: 'app-stat-card',
  imports: [LucideDynamicIcon, TranslatePipe],
  templateUrl: './stat-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly labelKey = input.required<string>();
  /** Pre-formatted by the caller — money and counts format differently. */
  readonly value = input.required<string>();
  readonly icon = input<LucideIcon>();
  readonly tone = input<StatTone>('neutral');
  /** Optional secondary line, already translated. */
  readonly hint = input<string>();
  readonly loading = input(false);

  protected iconClasses(): string {
    switch (this.tone()) {
      case 'brand':
        return 'bg-brand-50 text-brand-600';
      case 'sand':
        return 'bg-sand-100 text-sand-700';
      case 'danger':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-surface-container text-ink-700';
    }
  }
}
