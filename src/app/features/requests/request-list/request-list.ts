import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { REQUEST_STATUSES, ReconstructionRequest, RequestStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { RequestsApi } from '@core/api/requests-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * The beneficiary's own reconstruction requests — port of the legacy
 * beneficiary requests list. Distinct from the back-office `work-requests`
 * board: this reads `RequestsApi.getMyRequests`, scoped to the signed-in
 * beneficiary, and links into the beneficiary-facing request detail.
 */
@Component({
  selector: 'app-request-list',
  imports: [RouterLink, TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './request-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestList {
  private readonly api = inject(RequestsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = REQUEST_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<RequestStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.getMyRequests(params),
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

  protected readonly columns: DataTableColumn<ReconstructionRequest>[] = [
    {
      key: 'requestNumber',
      headerKey: 'requests.list.columns.requestNumber',
      cell: (row) => row.requestNumber,
    },
    {
      key: 'propertyType',
      headerKey: 'requests.list.columns.propertyType',
      cell: (row) => this.t(`master.propertyType.${row.propertyType}`),
      hideOnMobile: true,
    },
    {
      key: 'governorate',
      headerKey: 'requests.list.columns.governorate',
      cell: (row) => this.t(`governorates.${row.address.governorate}`),
      hideOnMobile: true,
    },
    {
      key: 'createdAt',
      headerKey: 'requests.list.columns.createdAt',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'requests.list.columns.status',
      cell: (row) => this.t(`shared.statusPill.request.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: ReconstructionRequest): string => `/app/requests/${row.id}`;
  protected readonly rowId = (row: ReconstructionRequest): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.set('');
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
