import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  GAZA_GOVERNORATES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  WorkOrder,
  WorkOrderStatus,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { WorkOrdersApi } from '@core/api/work-orders-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Work-order queue — port of the legacy `workorder-list`. The legacy list
 * carried marketplace actions per row (Create Estimate/Invoice/PO, Excel
 * import/export); those belong to their own features, so the list here is a
 * clean triage view and the actions live on the detail page and their own
 * modules.
 */
@Component({
  selector: 'app-work-order-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatCard, StatusPill],
  templateUrl: './work-order-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderList {
  private readonly api = inject(WorkOrdersApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = WORK_ORDER_STATUSES;
  protected readonly priorities = WORK_ORDER_PRIORITIES;
  protected readonly governorates = GAZA_GOVERNORATES;

  protected readonly search = signal('');
  protected readonly status = signal<WorkOrderStatus | ''>('');
  protected readonly priority = signal('');
  protected readonly governorate = signal('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
      priority: this.priority() || undefined,
      governorate: this.governorate() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.status();
      this.priority();
      this.governorate();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);

  protected readonly columns: DataTableColumn<WorkOrder>[] = [
    { key: 'workOrderNumber', headerKey: 'workOrders.columns.number', cell: (row) => row.workOrderNumber },
    { key: 'title', headerKey: 'workOrders.columns.title', cell: (row) => row.title },
    { key: 'teamName', headerKey: 'workOrders.columns.team', cell: (row) => row.teamName, hideOnMobile: true },
    {
      key: 'priority',
      headerKey: 'workOrders.columns.priority',
      cell: (row) => this.t(`workOrders.priority.${row.priority}`),
    },
    {
      key: 'status',
      headerKey: 'workOrders.columns.status',
      cell: (row) => this.t(`shared.statusPill.workOrder.${row.status}`),
    },
    {
      key: 'scheduledFor',
      headerKey: 'workOrders.columns.scheduled',
      cell: (row) => (row.scheduledFor ? this.formatDate(row.scheduledFor) : '—'),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: WorkOrder): string => `/app/work-orders/${row.id}`;
  protected readonly rowId = (row: WorkOrder): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.priority.set('');
    this.governorate.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
