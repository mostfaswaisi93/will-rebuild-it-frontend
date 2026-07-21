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
import { WorkOrder, WorkOrderStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { WorkOrdersApi } from '@core/api/work-orders-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** Mirror of the handler's transition map, so the UI only offers valid moves. */
const TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['dispatched', 'onHold', 'cancelled'],
  dispatched: ['inProgress', 'onHold', 'cancelled'],
  inProgress: ['completed', 'onHold', 'cancelled'],
  onHold: ['dispatched', 'inProgress', 'cancelled'],
  completed: ['inspected'],
  inspected: ['closed'],
  closed: [],
  cancelled: [],
};

@Component({
  selector: 'app-work-order-detail',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './work-order-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderDetail {
  readonly id = input.required<string>();

  private readonly api = inject(WorkOrdersApi);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly order = computed<WorkOrder | null>(() => this.resource.value() ?? null);
  protected readonly transitioning = signal(false);

  protected readonly nextStates = computed<WorkOrderStatus[]>(() => {
    const status = this.order()?.status;
    return status ? TRANSITIONS[status] : [];
  });

  protected readonly preWorkDone = computed(() => !!this.order()?.preWorkInspection?.completedAt);
  protected readonly postWorkDone = computed(() => !!this.order()?.postWorkInspection?.completedAt);

  /** Completing needs the pre-work inspection; moving to inspected needs the
   * post-work one. Surfacing this disables the button rather than letting the
   * API reject it after a click. */
  protected blockedReason(target: WorkOrderStatus): string | null {
    if (target === 'completed' && !this.preWorkDone()) {
      return 'workOrders.detail.needPreWork';
    }
    if (target === 'inspected' && !this.postWorkDone()) {
      return 'workOrders.detail.needPostWork';
    }
    return null;
  }

  protected transition(target: WorkOrderStatus): void {
    const order = this.order();
    if (!order || this.transitioning() || this.blockedReason(target)) {
      return;
    }

    this.transitioning.set(true);
    this.api
      .transition(order.id, target)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.transitioning.set(false);
          this.resource.set(updated);
          this.toast.success('workOrders.detail.statusUpdated');
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

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
