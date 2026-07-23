import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { StockItem } from '@core/models';
import { InventoryApi, WarehouseDetail as WarehouseDetailDto } from '@core/api/inventory-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** A store and everything held in it — port of the legacy `locationdetails`. */
@Component({
  selector: 'app-warehouse-detail',
  imports: [TranslatePipe, PageHeader, StatCard, DataTable, StatusPill],
  templateUrl: './warehouse-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseDetail {
  readonly id = input.required<string>();

  private readonly api = inject(InventoryApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getWarehouse(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly warehouse = computed<WarehouseDetailDto | null>(
    () => this.resource.value() ?? null,
  );
  protected readonly stock = computed<StockItem[]>(() => this.warehouse()?.stock ?? []);

  protected readonly columns: DataTableColumn<StockItem>[] = [
    { key: 'code', headerKey: 'inventory.columns.code', cell: (row) => row.code },
    { key: 'description', headerKey: 'inventory.columns.description', cell: (row) => row.description },
    {
      key: 'category',
      headerKey: 'warehouses.detail.category',
      cell: (row) => this.t(`materials.${row.category}`),
      hideOnMobile: true,
    },
    {
      key: 'quantity',
      headerKey: 'inventory.columns.quantity',
      cell: (row) => `${this.count(row.quantityOnHand)} ${this.t(`units.${row.unit}`)}`,
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'inventory.columns.status',
      cell: (row) => this.t(`shared.statusPill.stock.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: StockItem): string => `/app/inventory/${row.id}`;
  protected readonly rowId = (row: StockItem): string => row.id;

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
