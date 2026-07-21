import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  DISBURSEMENT_METHODS,
  DISBURSEMENT_STATUSES,
  DisbursementMethod,
  DisbursementStatus,
  Payout,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DisbursementsApi } from '@core/api/disbursements-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Disbursement (payout) ledger — port of the legacy `payment-list`. The money
 * the platform pays out to teams against approved statements. Headlined by
 * what is in flight versus settled, because in-flight transfers are what a
 * finance operator chases.
 */
@Component({
  selector: 'app-disbursement-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatCard, StatusPill],
  templateUrl: './disbursement-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisbursementList {
  private readonly api = inject(DisbursementsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = DISBURSEMENT_STATUSES;
  protected readonly methods = DISBURSEMENT_METHODS;

  protected readonly search = signal('');
  protected readonly status = signal<DisbursementStatus | ''>('');
  protected readonly method = signal<DisbursementMethod | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
      method: this.method() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.status();
      this.method();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);

  protected readonly columns: DataTableColumn<Payout>[] = [
    { key: 'payoutNumber', headerKey: 'disbursements.columns.number', cell: (row) => row.payoutNumber },
    { key: 'teamName', headerKey: 'disbursements.columns.team', cell: (row) => row.teamName },
    {
      key: 'method',
      headerKey: 'disbursements.columns.method',
      cell: (row) => this.t(`disbursements.method.${row.method}`),
      hideOnMobile: true,
    },
    {
      key: 'amount',
      headerKey: 'disbursements.columns.amount',
      cell: (row) => this.money(row.amount, row.currency),
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'disbursements.columns.status',
      cell: (row) => this.t(`shared.statusPill.disbursement.${row.status}`),
    },
    {
      key: 'createdAt',
      headerKey: 'disbursements.columns.created',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: Payout): string => `/app/disbursements/${row.id}`;
  protected readonly rowId = (row: Payout): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.method.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected money(amount: number, currency = 'USD'): string {
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
