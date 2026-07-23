import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FUNDING_STATUSES, Funding, FundingStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { FundingApi } from '@core/api/funding-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/** Funding records tied to the beneficiary's projects — port of the legacy
 * funding list. Reads `FundingApi.getFundingList`. */
@Component({
  selector: 'app-funding-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './funding-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundingList {
  private readonly api = inject(FundingApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = FUNDING_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<FundingStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.getFundingList(params),
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

  protected readonly columns: DataTableColumn<Funding>[] = [
    { key: 'fundingNumber', headerKey: 'funding.list.column.fundingNumber', cell: (row) => row.fundingNumber },
    { key: 'project', headerKey: 'funding.list.column.project', cell: (row) => row.projectTitle },
    {
      key: 'funded',
      headerKey: 'funding.list.column.fundedAmount',
      cell: (row) => this.money(row.fundedAmount),
      align: 'end',
      hideOnMobile: true,
    },
    {
      key: 'outstanding',
      headerKey: 'funding.list.column.outstanding',
      cell: (row) => this.money(row.outstandingAmount),
      align: 'end',
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'funding.list.column.status',
      cell: (row) => this.t(`shared.statusPill.funding.${row.status}`),
    },
  ];

  protected readonly rowId = (row: Funding): string => row.id;
  protected readonly rowLink = (row: Funding): string => `/app/funding/${row.id}`;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.set('');
  }

  private money(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
