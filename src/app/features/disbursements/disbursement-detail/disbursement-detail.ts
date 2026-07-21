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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DisbursementStatus, Payout } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DisbursementsApi } from '@core/api/disbursements-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** Mirror of the handler's map, so the UI only offers valid moves. */
const TRANSITIONS: Record<DisbursementStatus, DisbursementStatus[]> = {
  pending: ['authorised', 'failed'],
  authorised: ['sent', 'failed'],
  sent: ['settled', 'failed'],
  settled: [],
  failed: [],
};

@Component({
  selector: 'app-disbursement-detail',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './disbursement-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisbursementDetail {
  readonly id = input.required<string>();

  private readonly api = inject(DisbursementsApi);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly payout = computed<Payout | null>(() => this.resource.value() ?? null);
  protected readonly transitioning = signal(false);

  protected readonly nextStates = computed<DisbursementStatus[]>(() => {
    const status = this.payout()?.status;
    return status ? TRANSITIONS[status] : [];
  });

  /** A reference is captured when marking a payout sent. */
  protected readonly reference = new FormControl('', { nonNullable: true });
  protected readonly needsReference = computed(
    () => this.payout()?.status === 'authorised' && !this.payout()?.reference,
  );

  protected transition(target: DisbursementStatus): void {
    const payout = this.payout();
    if (!payout || this.transitioning()) {
      return;
    }
    this.transitioning.set(true);
    const reference = target === 'sent' ? this.reference.value.trim() || undefined : undefined;
    this.api
      .transition(payout.id, target, reference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.transitioning.set(false);
          this.resource.set(updated);
          this.reference.reset('');
          this.toast.success(
            target === 'failed'
              ? 'disbursements.detail.markedFailed'
              : 'disbursements.detail.statusUpdated',
          );
        },
        error: () => {
          this.transitioning.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected money(amount: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
