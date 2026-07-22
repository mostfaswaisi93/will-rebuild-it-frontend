import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DeliveryLog, LOG_CHANNELS, LOG_STATUSES, LogChannel, LogStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { LogsApi } from '@core/api/logs-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 15;

/**
 * Message-delivery log — port of the legacy Twilio/SendGrid `logs` screens.
 * The operator searches here when a code or notification is reported missing.
 */
@Component({
  selector: 'app-log-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './log-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogList {
  private readonly api = inject(LogsApi);
  private readonly translation = inject(TranslationService);

  protected readonly channels = LOG_CHANNELS;
  protected readonly statuses = LOG_STATUSES;

  protected readonly search = signal('');
  protected readonly channel = signal<LogChannel | ''>('');
  protected readonly status = signal<LogStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      channel: this.channel() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.channel();
      this.status();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<DeliveryLog>[] = [
    {
      key: 'channel',
      headerKey: 'logs.columns.channel',
      cell: (row) => this.t(`logs.channel.${row.channel}`),
    },
    { key: 'recipient', headerKey: 'logs.columns.recipient', cell: (row) => row.recipient },
    { key: 'subject', headerKey: 'logs.columns.subject', cell: (row) => row.subject, hideOnMobile: true },
    {
      key: 'status',
      headerKey: 'logs.columns.status',
      cell: (row) => this.t(`shared.statusPill.deliveryLog.${row.status}`),
    },
    {
      key: 'createdAt',
      headerKey: 'logs.columns.time',
      cell: (row) => this.formatDateTime(row.createdAt),
      hideOnMobile: true,
    },
  ];

  protected readonly rowId = (row: DeliveryLog): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.channel.set('');
    this.status.set('');
    this.search.set('');
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  }
}
