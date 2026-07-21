import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  MATERIAL_CATEGORIES,
  MaterialCategory,
  STOCK_STATUSES,
  StockItem,
  StockStatus,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { InventoryApi } from '@core/api/inventory-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 12;

/**
 * Material stock across warehouses — port of the legacy `inventorylist`. The
 * operator's restock view: the low and out-of-stock counts are the headline,
 * because those are what trigger a purchase order.
 */
@Component({
  selector: 'app-stock-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatCard, StatusPill],
  templateUrl: './stock-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockList {
  private readonly api = inject(InventoryApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = STOCK_STATUSES;
  protected readonly categoriesList = MATERIAL_CATEGORIES;
  protected readonly warehouses = rxResource({ stream: () => this.api.getWarehouses() });

  protected readonly search = signal('');
  protected readonly warehouseId = signal('');
  protected readonly category = signal<MaterialCategory | ''>('');
  protected readonly status = signal<StockStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      warehouseId: this.warehouseId() || undefined,
      category: this.category() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.listStock(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.warehouseId();
      this.category();
      this.status();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);
  protected readonly warehouseList = computed(() => this.warehouses.value() ?? []);

  protected readonly columns: DataTableColumn<StockItem>[] = [
    { key: 'code', headerKey: 'inventory.columns.code', cell: (row) => row.code },
    { key: 'description', headerKey: 'inventory.columns.description', cell: (row) => row.description },
    { key: 'warehouseName', headerKey: 'inventory.columns.warehouse', cell: (row) => row.warehouseName, hideOnMobile: true },
    {
      key: 'quantity',
      headerKey: 'inventory.columns.quantity',
      cell: (row) => `${this.count(row.quantityOnHand)} ${this.t('units.' + row.unit)}`,
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'inventory.columns.status',
      cell: (row) => this.t(`shared.statusPill.stock.${row.status}`),
    },
  ];

  protected readonly rowId = (row: StockItem): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.warehouseId.set('');
    this.category.set('');
    this.status.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
