import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { StatusPillContext, StatusTone, resolveStatusTone } from './status-tone.util';

const TONE_CLASSES: Record<StatusTone, string> = {
  brand: 'bg-brand-500 text-white',
  success: 'bg-brand-100 text-brand-800',
  warning: 'bg-sand-100 text-sand-700',
  danger: 'bg-error-container text-on-error-container',
  info: 'bg-info/10 text-info',
  neutral: 'bg-ink-300/40 text-ink-700',
  sandStrong: 'bg-sand-500 text-white',
};

/** Small colored capsule/badge showing a status, tone driven by status-tone.util. */
@Component({
  selector: 'app-status-pill',
  imports: [TranslatePipe],
  templateUrl: './status-pill.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPill {
  readonly context = input.required<StatusPillContext>();
  readonly status = input.required<string>();

  protected readonly resolved = computed(() => resolveStatusTone(this.context(), this.status()));
  protected readonly toneClasses = computed(() => TONE_CLASSES[this.resolved().tone]);
}
