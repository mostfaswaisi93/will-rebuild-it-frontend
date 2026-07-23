import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Disbursement, Funding } from '@core/models';
import { FundingApi } from '@core/api/funding-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SignaturePad } from '@shared/ui/signature-pad/signature-pad';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** How the receipt was signed, kept with the record as part of the audit trail. */
interface SignatureMeta {
  type: 'draw' | 'type';
  text?: string;
}

/**
 * One funding record: what has been disbursed for a project phase, and the
 * beneficiary's confirmation that the money actually reached them.
 *
 * That confirmation is the point of the page. Funds moving on paper is not the
 * same as funds arriving, so receipt is acknowledged by a signature that is
 * stored with the record — which is why this captures *how* it was signed too.
 */
@Component({
  selector: 'app-funding-detail',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill, SignaturePad],
  templateUrl: './funding-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundingDetail {
  readonly id = input.required<string>();

  private readonly api = inject(FundingApi);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getFundingDetails(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly funding = computed<Funding | null>(() => this.resource.value() ?? null);

  /** Newest first — the most recent payment is what a beneficiary looks for. */
  protected readonly disbursements = computed<Disbursement[]>(() =>
    [...(this.funding()?.disbursements ?? [])].sort((a, b) =>
      b.disbursedAt.localeCompare(a.disbursedAt),
    ),
  );

  protected readonly confirmed = computed(() => !!this.funding()?.receiptConfirmedAt);
  protected readonly signing = signal(false);
  protected readonly submitting = signal(false);
  protected readonly termsAccepted = signal(false);

  private readonly meta = signal<SignatureMeta>({ type: 'draw' });

  protected openSigning(): void {
    this.signing.set(true);
  }

  protected onMeta(meta: SignatureMeta): void {
    this.meta.set(meta);
  }

  protected toggleTerms(checked: boolean): void {
    this.termsAccepted.set(checked);
  }

  /** Fired by the pad once the beneficiary confirms their signature. */
  protected onSignature(signatureImage: string): void {
    const funding = this.funding();
    if (!funding || this.submitting()) {
      return;
    }
    if (!this.termsAccepted()) {
      this.toast.danger('funding.details.confirmReceipt.termsLabel');
      return;
    }

    const meta = this.meta();
    this.submitting.set(true);
    this.api
      .confirmReceipt(funding.id, {
        signatureImage,
        signatureType: meta.type,
        signatureText: meta.text,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.signing.set(false);
          this.resource.set(updated);
          this.toast.success('funding.signature.success');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

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
