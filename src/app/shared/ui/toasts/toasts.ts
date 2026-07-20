import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  LucideAlertCircle,
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideDynamicIcon,
  LucideInfo,
  LucideX,
  type LucideIcon,
} from '@lucide/angular';
import { ToastService, ToastTone } from '@core/toast/toast.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Renders the live toast stack from `ToastService`. Meant to be mounted once
 * near the root of the app shell (e.g. `<app-toasts />` alongside
 * `<router-outlet>`), not per-page.
 */
@Component({
  selector: 'app-toasts',
  imports: [LucideDynamicIcon, LucideX, TranslatePipe],
  templateUrl: './toasts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toasts {
  protected readonly toastService = inject(ToastService);

  protected toneIcon(tone: ToastTone): LucideIcon {
    switch (tone) {
      case 'success':
        return LucideCheckCircle2;
      case 'danger':
        return LucideAlertCircle;
      case 'warning':
        return LucideAlertTriangle;
      case 'info':
      default:
        return LucideInfo;
    }
  }

  protected toneClasses(tone: ToastTone): string {
    switch (tone) {
      case 'success':
        return 'bg-brand-50 border border-brand-300 text-brand-800';
      case 'danger':
        return 'bg-error-container text-on-error-container';
      case 'warning':
        return 'bg-sand-100 border border-sand-300 text-sand-700';
      case 'info':
      default:
        return 'bg-surface border border-outline-variant text-ink-700';
    }
  }
}
