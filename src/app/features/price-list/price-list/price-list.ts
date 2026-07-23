import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CONTRACTOR_TRADES, ContractorTrade, PriceListItem } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { PriceListApi } from '@core/api/price-list-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';

const PAGE_SIZE = 10;

/** Platform reference price list for reconstruction services — port of the
 * legacy `priceList/ServicesPriceList`. Read-only agreed unit rates by trade. */
@Component({
  selector: 'app-price-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader],
  templateUrl: './price-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceList {
  private readonly api = inject(PriceListApi);
  private readonly translation = inject(TranslationService);

  protected readonly trades = CONTRACTOR_TRADES;

  protected readonly search = signal('');
  protected readonly trade = signal<ContractorTrade | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      trade: this.trade() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.trade();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<PriceListItem>[] = [
    { key: 'code', headerKey: 'priceList.columns.code', cell: (row) => row.code },
    { key: 'service', headerKey: 'priceList.columns.service', cell: (row) => row.serviceName },
    {
      key: 'trade',
      headerKey: 'priceList.columns.trade',
      cell: (row) => this.t(`trades.${row.trade}`),
      hideOnMobile: true,
    },
    {
      key: 'unit',
      headerKey: 'priceList.columns.unit',
      cell: (row) => this.t(`units.${row.unit}`),
      hideOnMobile: true,
    },
    {
      key: 'rate',
      headerKey: 'priceList.columns.rate',
      cell: (row) => this.money(row.rate, row.currency),
      align: 'end',
    },
  ];

  protected readonly rowId = (row: PriceListItem): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.trade.set('');
    this.search.set('');
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
