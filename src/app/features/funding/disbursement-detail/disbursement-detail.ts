import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Disbursement } from '@core/models';
import { FundingApi } from '@core/api/funding-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** A payment is either completed, voided, or refunded — each reads very
 * differently to someone checking whether money actually moved. */
type TxnMode = 'normal' | 'voided' | 'refunded';

/**
 * One payment against a funding record — port of the legacy transaction detail.
 * The funding page lists payments inline, but a voided or refunded payment
 * needs explaining rather than just flagging, and the receipt lives here.
 */
@Component({
  selector: 'app-disbursement-detail',
  imports: [TranslatePipe, PageHeader],
  templateUrl: './disbursement-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisbursementDetail {
  /** Both come from the route: `/app/funding/:fundingId/disbursements/:id`. */
  readonly fundingId = input.required<string>();
  readonly id = input.required<string>();

  private readonly api = inject(FundingApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ fundingId: this.fundingId(), id: this.id() }),
    stream: ({ params }) => this.api.getDisbursement(params.fundingId, params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly txn = computed<Disbursement | null>(() => this.resource.value() ?? null);

  /** Refunded outranks voided: money that went out and came back is the more
   * specific story. */
  protected readonly mode = computed<TxnMode>(() => {
    const txn = this.txn();
    if (txn?.isRefunded) {
      return 'refunded';
    }
    return txn?.isVoided ? 'voided' : 'normal';
  });

  protected money(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
