import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ESTIMATE_STATUSES, Estimate, EstimateStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { EstimatesApi } from '@core/api/estimates-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Bill-of-quantities estimates queue — port of the legacy `estimate-list`.
 *
 * The operator's job here is triage: which estimates are waiting on a decision.
 * The legacy list mixed pro-side and admin-side concerns in one 800-line
 * component; this is the review view, with the pending count surfaced as the
 * headline the operator actually works from.
 */
@Component({
  selector: 'app-estimate-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatCard, StatusPill],
  templateUrl: './estimate-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstimateList {
  private readonly api = inject(EstimatesApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = ESTIMATE_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<EstimateStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.getEstimates(params),
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

  /** Pending count drives the headline; computed off the current page's rows is
   * not enough (paging hides some), so it comes from a dedicated unfiltered
   * fetch. */
  private readonly all = rxResource({
    stream: () => this.api.getEstimates({ pageNo: 1, pageSize: 500 }),
  });
  private readonly allRows = computed(() => this.all.value()?.items ?? []);

  protected readonly pendingCount = computed(
    () => this.allRows().filter((estimate) => estimate.status === 'pendingApproval').length,
  );
  protected readonly approvedCount = computed(
    () => this.allRows().filter((estimate) => estimate.status === 'approved').length,
  );
  protected readonly approvedValue = computed(() =>
    this.allRows()
      .filter((estimate) => estimate.status === 'approved')
      .reduce((sum, estimate) => sum + estimate.total, 0),
  );

  protected readonly columns: DataTableColumn<Estimate>[] = [
    {
      key: 'estimateNumber',
      headerKey: 'estimates.columns.number',
      cell: (row) => row.estimateNumber,
    },
    {
      key: 'projectTitle',
      headerKey: 'estimates.columns.project',
      cell: (row) => row.projectTitle,
    },
    { key: 'teamName', headerKey: 'estimates.columns.team', cell: (row) => row.teamName },
    {
      key: 'total',
      headerKey: 'estimates.columns.total',
      cell: (row) => this.money(row.total),
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'estimates.columns.status',
      cell: (row) => this.t(`shared.statusPill.estimate.${row.status}`),
    },
    {
      key: 'createdAt',
      headerKey: 'estimates.columns.created',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: Estimate): string => `/app/estimates/${row.id}`;
  protected readonly rowId = (row: Estimate): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected money(amount: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
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
