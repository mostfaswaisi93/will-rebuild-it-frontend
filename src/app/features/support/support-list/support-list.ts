import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SUPPORT_STATUSES, SupportStatus, SupportTicket } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SupportApi } from '@core/api/support-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Support-ticket queue — port of the legacy `customer-tickets`. Reuses the
 * existing `SupportApi`; the operator works the beneficiaries' tickets from
 * here, opening each to reply.
 */
@Component({
  selector: 'app-support-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './support-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportList {
  private readonly api = inject(SupportApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = SUPPORT_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<SupportStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.getTickets(params),
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

  protected readonly columns: DataTableColumn<SupportTicket>[] = [
    { key: 'ticketNumber', headerKey: 'supportQueue.columns.number', cell: (row) => row.ticketNumber },
    { key: 'subject', headerKey: 'supportQueue.columns.subject', cell: (row) => row.subject },
    {
      key: 'project',
      headerKey: 'supportQueue.columns.project',
      cell: (row) => row.projectTitle ?? '—',
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'supportQueue.columns.status',
      cell: (row) => this.t(`shared.statusPill.support.${row.status}`),
    },
    {
      key: 'createdAt',
      headerKey: 'supportQueue.columns.created',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: SupportTicket): string => `/app/support/${row.id}`;
  protected readonly rowId = (row: SupportTicket): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.set('');
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
