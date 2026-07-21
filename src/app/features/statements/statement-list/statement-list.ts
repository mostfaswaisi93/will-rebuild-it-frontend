import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { STATEMENT_STATUSES, Statement, StatementStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { StatementsApi } from '@core/api/statements-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Progress-claim (statement) queue — the reconstruction analogue of the legacy
 * `invoice-list`. Statements flow the other way from an invoice: a contractor
 * claims for work done and the platform reviews and pays. The list is the
 * reviewer's queue, headlined by what is awaiting review and what is approved
 * but unpaid.
 */
@Component({
  selector: 'app-statement-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatCard, StatusPill],
  templateUrl: './statement-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementList {
  private readonly api = inject(StatementsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = STATEMENT_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<StatementStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
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
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);

  protected readonly columns: DataTableColumn<Statement>[] = [
    { key: 'statementNumber', headerKey: 'statements.columns.number', cell: (row) => row.statementNumber },
    { key: 'projectTitle', headerKey: 'statements.columns.project', cell: (row) => row.projectTitle },
    { key: 'teamName', headerKey: 'statements.columns.team', cell: (row) => row.teamName, hideOnMobile: true },
    {
      key: 'netAmount',
      headerKey: 'statements.columns.net',
      cell: (row) => this.money(row.netAmount),
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'statements.columns.status',
      cell: (row) => this.t(`shared.statusPill.statement.${row.status}`),
    },
    {
      key: 'submittedAt',
      headerKey: 'statements.columns.submitted',
      cell: (row) => (row.submittedAt ? this.formatDate(row.submittedAt) : '—'),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: Statement): string => `/app/statements/${row.id}`;
  protected readonly rowId = (row: Statement): string => row.id;

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
