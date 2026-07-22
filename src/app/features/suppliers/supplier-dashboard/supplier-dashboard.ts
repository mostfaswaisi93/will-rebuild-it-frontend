import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideClipboardList, LucidePackage, LucideTruck } from '@lucide/angular';
import { PurchaseOrder } from '@core/models';
import { InventoryApi } from '@core/api/inventory-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * The material supplier's home (`/app/supplier-dashboard`, per
 * `homeRouteForRole`). The mock backend has no supplier-dashboard aggregate, so
 * this derives headline figures client-side from the purchase-order list the
 * supplier already reads, plus a recent-orders table.
 */
@Component({
  selector: 'app-supplier-dashboard',
  imports: [TranslatePipe, PageHeader, StatCard, DataTable, StatusPill],
  templateUrl: './supplier-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierDashboard {
  private readonly api = inject(InventoryApi);
  private readonly translation = inject(TranslationService);

  protected readonly icons = {
    orders: LucideClipboardList,
    inTransit: LucideTruck,
    received: LucidePackage,
  };

  private readonly orders = rxResource({
    stream: () => this.api.listPurchaseOrders({ pageNo: 1, pageSize: 50 }),
  });

  protected readonly loading = computed(() => this.orders.isLoading());
  protected readonly failed = computed(() => this.orders.error() !== undefined);

  private readonly all = computed<PurchaseOrder[]>(() => this.orders.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.orders.value()?.totalCount ?? 0);
  protected readonly awaitingCount = computed(
    () => this.all().filter((po) => po.status === 'awaitingApproval').length,
  );
  protected readonly orderedCount = computed(
    () => this.all().filter((po) => po.status === 'ordered' || po.status === 'partiallyReceived').length,
  );
  protected readonly receivedCount = computed(
    () => this.all().filter((po) => po.status === 'received').length,
  );

  /** Five most recent orders. */
  protected readonly recentOrders = computed(() =>
    [...this.all()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  );

  protected readonly columns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'poNumber', headerKey: 'supplierDashboard.columns.number', cell: (row) => row.poNumber },
    { key: 'warehouse', headerKey: 'supplierDashboard.columns.warehouse', cell: (row) => row.warehouseName, hideOnMobile: true },
    {
      key: 'subtotal',
      headerKey: 'supplierDashboard.columns.total',
      cell: (row) => this.money(row.subtotal, row.currency),
      align: 'end',
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'supplierDashboard.columns.status',
      cell: (row) => this.t(`shared.statusPill.purchaseOrder.${row.status}`),
    },
  ];

  protected readonly orderLink = (row: PurchaseOrder): string => `/app/purchase-orders/${row.id}`;
  protected readonly trackOrder = (row: PurchaseOrder): string => row.id;

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  private money(value: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
