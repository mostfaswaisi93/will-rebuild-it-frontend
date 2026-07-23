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
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Statement } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { StatementsApi } from '@core/api/statements-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

type Panel = 'none' | 'reject' | 'pay';

/**
 * Progress-claim review — the reviewer reads the claimed lines, sees the
 * retention held back, and either approves (for the net or a reduced amount),
 * rejects with a reason, or records a payment against an approved claim.
 */
@Component({
  selector: 'app-statement-detail',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './statement-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementDetail {
  readonly id = input.required<string>();

  private readonly api = inject(StatementsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly statement = computed<Statement | null>(() => this.resource.value() ?? null);

  private readonly isAdmin = computed(() => this.session.role() === 'admin');
  protected readonly canReview = computed(() => {
    const status = this.statement()?.status;
    return this.isAdmin() && (status === 'submitted' || status === 'underReview');
  });
  /** Only a submitted statement can be claimed for review. */
  protected readonly canStartReview = computed(
    () => this.isAdmin() && this.statement()?.status === 'submitted',
  );
  protected readonly canPay = computed(() => {
    const s = this.statement();
    return (
      this.isAdmin() &&
      !!s &&
      (s.status === 'approved' || s.status === 'partiallyPaid') &&
      s.paidAmount < s.approvedAmount
    );
  });
  protected readonly outstanding = computed(() => {
    const s = this.statement();
    return s ? s.approvedAmount - s.paidAmount : 0;
  });

  protected readonly panel = signal<Panel>('none');
  protected readonly submitting = signal(false);

  protected readonly rejectReason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)],
  });
  protected readonly payAmount = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1)],
  });

  /**
   * Claims the statement for review, signalling to the contractor that it is
   * being looked at before a decision lands. Optional — approving straight from
   * `submitted` is allowed — but without this the `underReview` state is
   * unreachable from the UI.
   */
  protected startReview(): void {
    const statement = this.statement();
    if (!statement || this.submitting()) {
      return;
    }
    this.run(this.api.startReview(statement.id), 'statements.detail.reviewStarted');
  }

  protected approve(): void {
    const statement = this.statement();
    if (!statement || this.submitting()) {
      return;
    }
    this.run(this.api.approve(statement.id), 'statements.detail.approved');
  }

  protected openReject(): void {
    this.panel.set('reject');
  }

  protected openPay(): void {
    this.payAmount.setValue(this.outstanding());
    this.panel.set('pay');
  }

  protected closePanel(): void {
    this.panel.set('none');
    this.rejectReason.reset('');
    this.payAmount.reset(null);
  }

  protected confirmReject(): void {
    const statement = this.statement();
    if (!statement || this.submitting()) {
      return;
    }
    if (this.rejectReason.invalid) {
      this.rejectReason.markAsTouched();
      return;
    }
    this.run(this.api.reject(statement.id, this.rejectReason.value.trim()), 'statements.detail.rejected');
  }

  protected confirmPay(): void {
    const statement = this.statement();
    const amount = this.payAmount.value;
    if (!statement || this.submitting() || amount === null) {
      return;
    }
    if (this.payAmount.invalid || amount > this.outstanding()) {
      this.payAmount.markAsTouched();
      return;
    }
    this.run(this.api.recordPayment(statement.id, amount), 'statements.detail.paid');
  }

  private run(source: ReturnType<StatementsApi['approve']>, successKey: string): void {
    this.submitting.set(true);
    source.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.resource.set(updated);
        this.closePanel();
        this.toast.success(successKey);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.danger('common.errorGeneric');
      },
    });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected money(amount: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected number(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), { maximumFractionDigits: 2 }).format(value);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
