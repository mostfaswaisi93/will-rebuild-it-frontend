import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ReconstructionRequest } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { RequestsApi } from '@core/api/requests-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** Beneficiary-facing detail for one reconstruction request: what was reported,
 * where it stands, and which teams have been matched or assigned. */
@Component({
  selector: 'app-request-detail',
  imports: [TranslatePipe, PageHeader, StatusPill],
  templateUrl: './request-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDetail {
  readonly id = input.required<string>();

  private readonly api = inject(RequestsApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getRequestDetails(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly request = computed<ReconstructionRequest | null>(
    () => this.resource.value() ?? null,
  );

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }

  protected matchScore(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
