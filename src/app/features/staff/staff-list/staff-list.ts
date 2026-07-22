import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { STAFF_STATUSES, StaffMember, StaffStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { StaffApi } from '@core/api/staff-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/** Field-staff register — port of the legacy `staff/stafflist`. */
@Component({
  selector: 'app-staff-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './staff-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffList {
  private readonly api = inject(StaffApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = STAFF_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<StaffStatus | ''>('');
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

  protected readonly columns: DataTableColumn<StaffMember>[] = [
    { key: 'name', headerKey: 'staff.columns.name', cell: (row) => row.name },
    { key: 'jobTitle', headerKey: 'staff.columns.jobTitle', cell: (row) => row.jobTitle },
    { key: 'teamName', headerKey: 'staff.columns.team', cell: (row) => row.teamName, hideOnMobile: true },
    {
      key: 'status',
      headerKey: 'staff.columns.status',
      cell: (row) => this.t(`shared.statusPill.staff.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: StaffMember): string => `/app/staff/${row.id}`;
  protected readonly rowId = (row: StaffMember): string => row.id;

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
}
