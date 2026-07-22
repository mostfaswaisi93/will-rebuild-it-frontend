import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideBuilding2, LucideCalculator, LucideFileText, LucideStar } from '@lucide/angular';
import { Project } from '@core/models';
import { TeamWorkspaceApi } from '@core/api/team-workspace-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * The signed-in reconstruction team's workspace home (`/app/team-dashboard`,
 * per `homeRouteForRole`). Reads the team-scoped `TeamWorkspaceApi` aggregate:
 * headline stats, active projects, and requests matched to this team.
 */
@Component({
  selector: 'app-team-dashboard',
  imports: [TranslatePipe, PageHeader, StatCard, DataTable, StatusPill],
  templateUrl: './team-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDashboard {
  private readonly api = inject(TeamWorkspaceApi);
  private readonly translation = inject(TranslationService);

  protected readonly icons = {
    projects: LucideBuilding2,
    delivered: LucideStar,
    estimates: LucideCalculator,
    requests: LucideFileText,
  };

  private readonly workspace = rxResource({
    stream: () => this.api.getWorkspace(),
  });

  protected readonly loading = computed(() => this.workspace.isLoading());
  protected readonly failed = computed(() => this.workspace.error() !== undefined);
  protected readonly data = computed(() => this.workspace.value() ?? null);
  protected readonly stats = computed(() => this.data()?.stats ?? null);
  protected readonly projects = computed<Project[]>(() => this.data()?.projects ?? []);
  protected readonly matchedRequests = computed(() => this.data()?.matchedRequests ?? []);

  protected readonly teamName = computed(() => this.data()?.team.name ?? '');

  protected readonly projectColumns: DataTableColumn<Project>[] = [
    { key: 'projectNumber', headerKey: 'projects.columns.number', cell: (row) => row.projectNumber },
    { key: 'title', headerKey: 'projects.columns.title', cell: (row) => row.title },
    {
      key: 'phase',
      headerKey: 'projects.columns.phase',
      cell: (row) => this.translation.translate(`project.phase.${row.currentPhaseKey}`),
      hideOnMobile: true,
    },
    {
      key: 'progress',
      headerKey: 'projects.columns.progress',
      cell: (row) => `${row.overallCompletionPercent}%`,
      align: 'end',
    },
  ];

  protected readonly projectLink = (row: Project): string => `/app/projects/${row.id}`;
  protected readonly trackProject = (row: Project): string => row.id;

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected rating(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected money(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
