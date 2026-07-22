import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { WorkOrder } from '@core/models';
import { WorkOrdersApi } from '@core/api/work-orders-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';

const PAGE_SIZE = 10;

/** `done` once an inspection is signed off, `inProgress` if started, `pending`
 * if not yet begun. */
type InspectionState = 'done' | 'inProgress' | 'pending';

/**
 * Site-inspection worklist — port of the legacy inspections view. The mock
 * models inspections inside each work order (`preWorkInspection` /
 * `postWorkInspection`), so this reads the work-order list and surfaces the two
 * inspection states per order, linking into the work-order inspection flow.
 */
@Component({
  selector: 'app-inspection-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader],
  templateUrl: './inspection-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionList {
  private readonly api = inject(WorkOrdersApi);
  private readonly translation = inject(TranslationService);

  protected readonly search = signal('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<WorkOrder>[] = [
    { key: 'number', headerKey: 'inspections.columns.workOrder', cell: (row) => row.workOrderNumber },
    { key: 'title', headerKey: 'inspections.columns.title', cell: (row) => row.title, hideOnMobile: true },
    { key: 'team', headerKey: 'inspections.columns.team', cell: (row) => row.teamName, hideOnMobile: true },
    {
      key: 'preWork',
      headerKey: 'inspections.columns.preWork',
      cell: (row) => this.t(`inspections.state.${this.stateOf(row.preWorkInspection)}`),
    },
    {
      key: 'postWork',
      headerKey: 'inspections.columns.postWork',
      cell: (row) => this.t(`inspections.state.${this.stateOf(row.postWorkInspection)}`),
    },
  ];

  protected readonly rowLink = (row: WorkOrder): string => `/app/work-orders/${row.id}`;
  protected readonly rowId = (row: WorkOrder): string => row.id;

  protected stateOf(inspection: WorkOrder['preWorkInspection']): InspectionState {
    if (!inspection) {
      return 'pending';
    }
    return inspection.completedAt ? 'done' : 'inProgress';
  }

  /** Tailwind classes for the state chip, keyed by inspection state. */
  protected chipClass(state: InspectionState): string {
    switch (state) {
      case 'done':
        return 'bg-success/10 text-success';
      case 'inProgress':
        return 'bg-info/10 text-info';
      default:
        return 'bg-surface-container text-ink-500';
    }
  }

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.search.set('');
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
