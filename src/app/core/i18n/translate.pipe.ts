import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

/**
 * Deliberately impure: this app has no build-time locale split, so every
 * translated string must react live to a runtime language toggle. At this
 * app's scale the extra per-cycle re-evaluation is negligible next to the
 * DX win of `{{ 'key' | translate }}` everywhere with no boilerplate.
 */
@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.translate(key, params);
  }
}
