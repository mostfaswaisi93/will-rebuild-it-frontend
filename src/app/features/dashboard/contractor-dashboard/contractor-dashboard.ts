import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideBuilding2, LucideCalculator, LucideFileText, LucideWallet } from '@lucide/angular';
import { DashboardApi } from '@core/api/dashboard-api.service';
import { DashboardProjectRow } from '@core/api/dto/dashboard.dto';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SessionStore } from '@core/session/session-store.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';

/**
 * Contractor's dashboard — port of the legacy `ProDashboardComponent`.
 *
 * The legacy page showed a greeting plus a jQuery-driven "Enable Vanlynk"
 * modal. That modal belonged to the subscription product, not the dashboard,
 * and its `$("#vanlynkpopup").modal()` calls are exactly the jQuery this port
 * removes; the subscription flow will own that decision if VANLYNK is carried
 * over at all. The greeting stays, backed by real work figures.
 */
@Component({
  selector: 'app-contractor-dashboard',
  imports: [TranslatePipe, PageHeader, StatCard, DataTable],
  templateUrl: './contractor-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractorDashboard {
  private readonly dashboardApi = inject(DashboardApi);
  private readonly session = inject(SessionStore);
  private readonly translation = inject(TranslationService);

  protected readonly icons = {
    projects: LucideBuilding2,
    estimates: LucideCalculator,
    requests: LucideFileText,
    funds: LucideWallet,
  };

  private readonly dashboard = rxResource({
    stream: () => this.dashboardApi.getContractorDashboard(),
  });

  protected readonly loading = computed(() => this.dashboard.isLoading());
  protected readonly data = computed(() => this.dashboard.value() ?? null);
  protected readonly failed = computed(() => this.dashboard.error() !== undefined);

  protected readonly greeting = computed(() => {
    const user = this.session.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  protected readonly projects = computed(() => this.data()?.activeProjects ?? []);

  protected readonly projectColumns: DataTableColumn<DashboardProjectRow>[] = [
    {
      key: 'projectNumber',
      headerKey: 'dashboard.projects.number',
      cell: (row) => row.projectNumber,
      sortable: true,
    },
    { key: 'title', headerKey: 'dashboard.projects.title', cell: (row) => row.title, sortable: true },
    {
      key: 'phase',
      headerKey: 'dashboard.projects.phase',
      cell: (row) => this.translation.translate(`project.phase.${row.currentPhaseKey}`),
      sortable: true,
    },
    {
      key: 'progress',
      headerKey: 'dashboard.projects.progress',
      cell: (row) => `${row.overallCompletionPercent}%`,
      sortValue: (row) => row.overallCompletionPercent,
      sortable: true,
      align: 'end',
    },
  ];

  protected readonly trackProject = (row: DashboardProjectRow): string => row.id;

  protected money(amount: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }
}
