import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import {
  GAZA_GOVERNORATES,
  DAMAGE_SEVERITIES,
  REQUEST_ORIGINS,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  ReconstructionRequest,
  RequestStatus,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { WorkRequestsApi } from '@core/api/work-requests-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Back-office reconstruction-request queue — port of the legacy `admin-list`
 * (the ADMIN branch of the role-switching `lead-list`).
 *
 * Server-side filtering/paging: the operator set can be large, and the summary
 * cards must reflect the whole filtered set, not just the visible page, so the
 * backend owns both. The legacy page opened a popover per column with a dozen
 * filter fields; that collapses here to the filters that still mean something
 * for Gaza reconstruction (status, severity, governorate, type) plus free-text
 * search — the US-only columns (zipcode, state) and lead-marketplace fields
 * (purchase date, price) are gone with the domain that needed them.
 */
@Component({
  selector: 'app-work-request-list',
  imports: [
    RouterLink,
    LucidePlus,
    TranslatePipe,
    DataTable,
    FilterBar,
    PageHeader,
    StatCard,
    StatusPill,
  ],
  templateUrl: './work-request-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkRequestList {
  private readonly api = inject(WorkRequestsApi);
  private readonly translation = inject(TranslationService);
  private readonly session = inject(SessionStore);

  protected readonly statuses = REQUEST_STATUSES;
  protected readonly severities = DAMAGE_SEVERITIES;
  protected readonly governorates = GAZA_GOVERNORATES;
  protected readonly types = REQUEST_TYPES;
  protected readonly origins = REQUEST_ORIGINS;

  /** Only an operator logs and decides on requests; a contractor just reads. */
  protected readonly canCreate = computed(() => this.session.role() === 'admin');

  protected readonly search = signal('');
  protected readonly status = signal<RequestStatus | ''>('');
  protected readonly severity = signal('');
  protected readonly governorate = signal('');
  protected readonly type = signal('');
  protected readonly origin = signal('');
  protected readonly pageNo = signal(1);

  private readonly query = computed(() => ({
    pageNo: this.pageNo(),
    pageSize: PAGE_SIZE,
    searchKey: this.search().trim() || undefined,
    status: this.status() || undefined,
    severity: this.severity() || undefined,
    governorate: this.governorate() || undefined,
    type: this.type() || undefined,
    origin: this.origin() || undefined,
  }));

  private readonly page = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    // Any filter change invalidates the current page number — page 4 of the
    // old result set rarely exists in the new one.
    effect(() => {
      this.search();
      this.status();
      this.severity();
      this.governorate();
      this.type();
      this.origin();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);

  protected readonly columns: DataTableColumn<ReconstructionRequest>[] = [
    {
      key: 'requestNumber',
      headerKey: 'workRequests.columns.number',
      cell: (row) => row.requestNumber,
    },
    {
      key: 'contactName',
      headerKey: 'workRequests.columns.beneficiary',
      cell: (row) => row.contactName,
    },
    {
      key: 'governorate',
      headerKey: 'workRequests.columns.governorate',
      cell: (row) => this.t(`governorates.${row.address.governorate}`),
    },
    {
      key: 'severity',
      headerKey: 'workRequests.columns.severity',
      cell: (row) => this.t(`master.severity.${row.severity}`),
    },
    {
      key: 'status',
      headerKey: 'workRequests.columns.status',
      // Plain-text projection for search/export; the template overrides the
      // visual with a status pill.
      cell: (row) => this.t(`shared.statusPill.request.${row.status}`),
    },
    {
      key: 'createdAt',
      headerKey: 'workRequests.columns.received',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: ReconstructionRequest): string => `/app/work-requests/${row.id}`;
  protected readonly rowId = (row: ReconstructionRequest): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.severity.set('');
    this.governorate.set('');
    this.type.set('');
    this.origin.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
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
