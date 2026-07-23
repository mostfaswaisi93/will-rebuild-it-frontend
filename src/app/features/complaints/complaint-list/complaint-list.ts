import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { COMPLAINT_STATUSES, Complaint, ComplaintStatus } from '@core/models';
import { ComplaintsApi } from '@core/api/complaints-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Complaints the signed-in user has raised against a reconstruction team —
 * reached from the header menu ("report a team"). Read-only register; filing a
 * new one lives at `/app/complaints/new`.
 */
@Component({
  selector: 'app-complaint-list',
  imports: [RouterLink, TranslatePipe, DataTable, PageHeader, StatusPill],
  templateUrl: './complaint-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintList {
  private readonly api = inject(ComplaintsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = COMPLAINT_STATUSES;

  protected readonly status = signal<ComplaintStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.getComplaints(params),
  });

  constructor() {
    effect(() => {
      this.status();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<Complaint>[] = [
    { key: 'number', headerKey: 'complaints.list.column.number', cell: (row) => row.complaintNumber },
    { key: 'team', headerKey: 'complaints.list.column.team', cell: (row) => row.teamName },
    {
      key: 'createdAt',
      headerKey: 'complaints.list.column.createdAt',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'complaints.list.column.status',
      cell: (row) => this.t(`shared.statusPill.complaint.${row.status}`),
    },
  ];

  protected readonly rowId = (row: Complaint): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  private formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
