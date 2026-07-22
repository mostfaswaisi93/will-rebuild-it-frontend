import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  SHIPMENT_CROSSINGS,
  SHIPMENT_STATUSES,
  Shipment,
  ShipmentCrossing,
  ShipmentStatus,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ShipmentsApi } from '@core/api/shipments-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/** Materials transport register — port of the legacy `inventory/truckOrderList`,
 * reframed around crossing clearance. Reads `ShipmentsApi.list`. */
@Component({
  selector: 'app-shipment-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatCard, StatusPill],
  templateUrl: './shipment-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentList {
  private readonly api = inject(ShipmentsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = SHIPMENT_STATUSES;
  protected readonly crossings = SHIPMENT_CROSSINGS;

  protected readonly search = signal('');
  protected readonly status = signal<ShipmentStatus | ''>('');
  protected readonly crossing = signal<ShipmentCrossing | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
      crossing: this.crossing() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.status();
      this.crossing();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);

  protected readonly columns: DataTableColumn<Shipment>[] = [
    { key: 'number', headerKey: 'shipments.columns.number', cell: (row) => row.shipmentNumber },
    { key: 'supplier', headerKey: 'shipments.columns.supplier', cell: (row) => row.supplierName, hideOnMobile: true },
    {
      key: 'destination',
      headerKey: 'shipments.columns.destination',
      cell: (row) => row.destinationWarehouseName,
      hideOnMobile: true,
    },
    {
      key: 'crossing',
      headerKey: 'shipments.columns.crossing',
      cell: (row) => this.t(`shipments.crossing.${row.crossing}`),
      hideOnMobile: true,
    },
    {
      key: 'trucks',
      headerKey: 'shipments.columns.trucks',
      cell: (row) => this.count(row.truckCount),
      align: 'end',
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'shipments.columns.status',
      cell: (row) => this.t(`shared.statusPill.shipment.${row.status}`),
    },
  ];

  protected readonly rowId = (row: Shipment): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.crossing.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
