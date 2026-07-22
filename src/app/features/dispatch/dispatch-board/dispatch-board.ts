import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { WorkOrder, WorkOrderStatus } from '@core/models';
import { WorkOrdersApi } from '@core/api/work-orders-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** The columns the board surfaces, in field-lifecycle order. Terminal states
 * (closed/inspected/cancelled) are intentionally omitted — the board is for
 * work in flight, not the archive. */
const BOARD_COLUMNS: readonly WorkOrderStatus[] = [
  'scheduled',
  'dispatched',
  'inProgress',
  'onHold',
  'completed',
];

interface BoardColumn {
  status: WorkOrderStatus;
  orders: WorkOrder[];
}

/**
 * Dispatch board — port of the legacy `pro/dispatchboard`. A read-only kanban
 * of in-flight work orders grouped by status, so operators see the field
 * pipeline at a glance. Cards link into the work-order detail, where the actual
 * state transitions happen.
 */
@Component({
  selector: 'app-dispatch-board',
  imports: [TranslatePipe, PageHeader, StatusPill],
  templateUrl: './dispatch-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchBoard {
  private readonly api = inject(WorkOrdersApi);
  private readonly translation = inject(TranslationService);

  private readonly page = rxResource({
    stream: () => this.api.list({ pageNo: 1, pageSize: 100 }),
  });

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);

  private readonly orders = computed<WorkOrder[]>(() => this.page.value()?.items ?? []);

  protected readonly columns = computed<BoardColumn[]>(() => {
    const orders = this.orders();
    return BOARD_COLUMNS.map((status) => ({
      status,
      orders: orders.filter((order) => order.status === status),
    }));
  });

  protected readonly skeletons = BOARD_COLUMNS;

  protected readonly orderLink = (order: WorkOrder): string => `/app/work-orders/${order.id}`;

  protected formatDate(iso: string | undefined): string {
    if (!iso) {
      return '';
    }
    return new Intl.DateTimeFormat(this.translation.locale(), {
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
