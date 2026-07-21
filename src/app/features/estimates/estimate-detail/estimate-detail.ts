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
import { Router } from '@angular/router';
import { BoqCategory, BoqItem, Estimate } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { EstimatesApi } from '@core/api/estimates-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SignaturePad } from '@shared/ui/signature-pad/signature-pad';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const CATEGORY_ORDER: BoqCategory[] = ['materials', 'labor', 'equipment', 'custom'];

interface BoqGroup {
  category: BoqCategory;
  items: BoqItem[];
  subtotal: number;
}

/**
 * Estimate review — port of the legacy `estimate-details` / `view-estimate`.
 *
 * The legacy component was ~16,000 lines because it was a full editable BoQ
 * *builder* (add/remove/reprice line items, live recalculation, PDF export).
 * The back-office job is narrower: read the submitted bill of quantities and
 * decide. So this is a read + decide view — approve with a captured signature,
 * or reject with a reason. Building the estimate is the team's task, in their
 * own workspace, and is out of scope here.
 */
@Component({
  selector: 'app-estimate-detail',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, SignaturePad, StatusPill],
  templateUrl: './estimate-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstimateDetail {
  readonly id = input.required<string>();

  private readonly api = inject(EstimatesApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getEstimateDetails(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly estimate = computed<Estimate | null>(() => this.resource.value() ?? null);

  /** Only an operator approves/rejects, and only while it is still pending. */
  protected readonly canDecide = computed(
    () => this.session.role() === 'admin' && this.estimate()?.status === 'pendingApproval',
  );

  /** BoQ grouped by category, each with its own subtotal — how a bill of
   * quantities is read. Empty categories are dropped. */
  protected readonly groups = computed<BoqGroup[]>(() => {
    const items = this.estimate()?.items ?? [];
    return CATEGORY_ORDER.map((category) => {
      const inCategory = items.filter((item) => item.category === category);
      return {
        category,
        items: inCategory,
        subtotal: inCategory.reduce((sum, item) => sum + item.totalCost, 0),
      };
    }).filter((group) => group.items.length > 0);
  });

  protected readonly showReject = signal(false);
  protected readonly rejectReason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)],
  });
  protected readonly submitting = signal(false);
  private capturedSignature = signal('');

  protected onSignature(dataUrl: string): void {
    this.capturedSignature.set(dataUrl);
  }

  protected readonly canApprove = computed(
    () => this.capturedSignature().length > 0 && !this.submitting(),
  );

  protected approve(): void {
    const estimate = this.estimate();
    const signature = this.capturedSignature();
    if (!estimate || !signature || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.api
      .approveEstimate(estimate.id, signature)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.resource.set(updated);
          this.toast.success('estimates.detail.approved');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected openReject(): void {
    this.showReject.set(true);
  }

  protected cancelReject(): void {
    this.showReject.set(false);
    this.rejectReason.reset('');
  }

  protected confirmReject(): void {
    const estimate = this.estimate();
    if (!estimate || this.submitting()) {
      return;
    }
    if (this.rejectReason.invalid) {
      this.rejectReason.markAsTouched();
      return;
    }

    this.submitting.set(true);
    this.api
      .rejectEstimate(estimate.id, this.rejectReason.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.showReject.set(false);
          this.resource.set(updated);
          this.toast.success('estimates.detail.rejected');
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
    return new Intl.NumberFormat(this.translation.locale(), { maximumFractionDigits: 2 }).format(
      value,
    );
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
