import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MasterApi } from '@core/api/master-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Privacy policy, reachable from the header user menu on every role. The body
 * is operator-maintained content served with the global settings, so it is
 * rendered as plain text rather than interpolated as HTML.
 */
@Component({
  selector: 'app-privacy-page',
  imports: [TranslatePipe, PageHeader],
  templateUrl: './privacy-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPage {
  private readonly api = inject(MasterApi);

  private readonly settings = rxResource({
    stream: () => this.api.getGlobalSettings(),
  });

  protected readonly loading = computed(() => this.settings.isLoading());
  protected readonly failed = computed(() => this.settings.error() !== undefined);
  protected readonly body = computed(() => this.settings.value()?.privacyBody ?? '');
}
