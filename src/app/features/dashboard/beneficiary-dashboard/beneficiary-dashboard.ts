import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideBuilding2, LucideFileText, LucideWallet } from '@lucide/angular';
import { Project } from '@core/models';
import { ProjectsApi } from '@core/api/projects-api.service';
import { RequestsApi } from '@core/api/requests-api.service';
import { FundingApi } from '@core/api/funding-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';

/**
 * The beneficiary's home (`/app/dashboard`, per `homeRouteForRole`). The mock
 * backend has no dedicated beneficiary-dashboard aggregate, so this composes
 * the three list endpoints the beneficiary already owns — projects, requests,
 * funding — into headline counts plus a "follow your rebuild" recent-projects
 * table.
 */
@Component({
  selector: 'app-beneficiary-dashboard',
  imports: [TranslatePipe, PageHeader, StatCard, DataTable],
  templateUrl: './beneficiary-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeneficiaryDashboard {
  private readonly projectsApi = inject(ProjectsApi);
  private readonly requestsApi = inject(RequestsApi);
  private readonly fundingApi = inject(FundingApi);
  private readonly translation = inject(TranslationService);

  protected readonly icons = {
    projects: LucideBuilding2,
    requests: LucideFileText,
    funding: LucideWallet,
  };

  private readonly projects = rxResource({
    stream: () => this.projectsApi.getMyProjects({ pageNo: 1, pageSize: 5 }),
  });
  private readonly requests = rxResource({
    stream: () => this.requestsApi.getMyRequests({ pageNo: 1, pageSize: 1 }),
  });
  private readonly funding = rxResource({
    stream: () => this.fundingApi.getFundingList({ pageNo: 1, pageSize: 1 }),
  });

  protected readonly loading = computed(
    () => this.projects.isLoading() || this.requests.isLoading() || this.funding.isLoading(),
  );
  protected readonly failed = computed(() => this.projects.error() !== undefined);

  protected readonly projectCount = computed(() => this.projects.value()?.totalCount ?? 0);
  protected readonly requestCount = computed(() => this.requests.value()?.totalCount ?? 0);
  protected readonly fundingCount = computed(() => this.funding.value()?.totalCount ?? 0);
  protected readonly recentProjects = computed<Project[]>(() => this.projects.value()?.items ?? []);

  protected readonly projectColumns: DataTableColumn<Project>[] = [
    { key: 'projectNumber', headerKey: 'dashboard.projects.number', cell: (row) => row.projectNumber },
    { key: 'title', headerKey: 'dashboard.projects.title', cell: (row) => row.title },
    {
      key: 'phase',
      headerKey: 'dashboard.projects.phase',
      cell: (row) => this.translation.translate(`project.phase.${row.currentPhaseKey}`),
      hideOnMobile: true,
    },
    {
      key: 'progress',
      headerKey: 'dashboard.projects.progress',
      cell: (row) => `${row.overallCompletionPercent}%`,
      align: 'end',
    },
  ];

  protected readonly projectLink = (row: Project): string => `/app/projects/${row.id}`;
  protected readonly trackProject = (row: Project): string => row.id;

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }
}
