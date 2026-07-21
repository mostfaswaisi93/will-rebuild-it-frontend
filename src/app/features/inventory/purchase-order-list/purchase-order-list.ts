import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PURCHASE_ORDER_STATUSES, PurchaseOrder, PurchaseOrderStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { InventoryApi } from '@core/api/inventory-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/** Purchase-order register — port of the legacy `purchaseOrderList`. */
@Component({
  selector: 'app-purchase-order-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './purchase-order-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderList {
  private readonly api = inject(InventoryApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = PURCHASE_ORDER_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<PurchaseOrderStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.listPurchaseOrders(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.status();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'poNumber', headerKey: 'purchaseOrders.columns.number', cell: (row) => row.poNumber },
    { key: 'supplierName', headerKey: 'purchaseOrders.columns.supplier', cell: (row) => row.supplierName },
    { key: 'warehouseName', headerKey: 'purchaseOrders.columns.warehouse', cell: (row) => row.warehouseName, hideOnMobile: true },
    {
      key: 'subtotal',
      headerKey: 'purchaseOrders.columns.total',
      cell: (row) => this.money(row.subtotal, row.currency),
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'purchaseOrders.columns.status',
      cell: (row) => this.t(`shared.statusPill.purchaseOrder.${row.status}`),
    },
    {
      key: 'createdAt',
      headerKey: 'purchaseOrders.columns.created',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: PurchaseOrder): string => `/app/purchase-orders/${row.id}`;
  protected readonly rowId = (row: PurchaseOrder): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.set('');
  }

  protected money(amount: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
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
