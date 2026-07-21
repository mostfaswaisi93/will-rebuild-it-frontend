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
import { PurchaseOrder, PurchaseOrderStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { InventoryApi } from '@core/api/inventory-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** Mirror of the handler's map, so the UI only offers valid moves. */
const TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['awaitingApproval', 'cancelled'],
  awaitingApproval: ['approved', 'cancelled'],
  approved: ['ordered', 'cancelled'],
  ordered: ['partiallyReceived', 'received', 'cancelled'],
  partiallyReceived: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

@Component({
  selector: 'app-purchase-order-detail',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './purchase-order-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderDetail {
  readonly id = input.required<string>();

  private readonly api = inject(InventoryApi);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getPurchaseOrder(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly order = computed<PurchaseOrder | null>(() => this.resource.value() ?? null);
  protected readonly transitioning = signal(false);

  protected readonly nextStates = computed<PurchaseOrderStatus[]>(() => {
    const status = this.order()?.status;
    return status ? TRANSITIONS[status] : [];
  });

  protected transition(target: PurchaseOrderStatus): void {
    const order = this.order();
    if (!order || this.transitioning()) {
      return;
    }
    this.transitioning.set(true);
    this.api
      .transitionPurchaseOrder(order.id, target)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.transitioning.set(false);
          this.resource.set(updated);
          this.toast.success(
            target === 'received'
              ? 'purchaseOrders.detail.receivedToStock'
              : 'purchaseOrders.detail.statusUpdated',
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
