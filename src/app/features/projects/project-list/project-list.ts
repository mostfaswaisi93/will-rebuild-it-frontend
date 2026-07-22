import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PROJECT_STATUSES, Project, ProjectStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ProjectsApi } from '@core/api/projects-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/** Reconstruction projects the beneficiary is following — port of the legacy
 * beneficiary projects list. Reads `ProjectsApi.getMyProjects`. */
@Component({
  selector: 'app-project-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './project-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectList {
  private readonly api = inject(ProjectsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = PROJECT_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<ProjectStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.getMyProjects(params),
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

  protected readonly columns: DataTableColumn<Project>[] = [
    { key: 'projectNumber', headerKey: 'projects.list.column.projectNumber', cell: (row) => row.projectNumber },
    { key: 'title', headerKey: 'projects.list.column.title', cell: (row) => row.title },
    {
      key: 'phase',
      headerKey: 'projects.list.column.phase',
      cell: (row) => this.t(`project.phase.${row.currentPhaseKey}`),
      hideOnMobile: true,
    },
    {
      key: 'progress',
      headerKey: 'projects.list.column.progress',
      cell: (row) => `${row.overallCompletionPercent}%`,
      sortValue: (row) => row.overallCompletionPercent,
      align: 'end',
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'projects.list.column.status',
      cell: (row) => this.t(`shared.statusPill.project.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: Project): string => `/app/projects/${row.id}`;
  protected readonly rowId = (row: Project): string => row.id;

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
