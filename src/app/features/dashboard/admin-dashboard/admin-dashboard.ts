import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  LucideBuilding2,
  LucideFileText,
  LucideUsers,
  LucideWallet,
} from '@lucide/angular';
import { DashboardApi } from '@core/api/dashboard-api.service';
import { DashboardRequestRow } from '@core/api/dto/dashboard.dto';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SessionStore } from '@core/session/session-store.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';

/**
 * Platform operator's dashboard — port of the legacy `TopprozHomeComponent`.
 *
 * The legacy page rendered only "Hi {name} Welcome to TOPPROZ Admin!"; its four
 * stat cards were present but commented out, and its "View More" link too. The
 * greeting is kept and those cards are revived against real reconstruction
 * figures, since a dashboard with no figures gives an operator nothing to act
 * on. Everything here reads from `/dashboard/admin`.
 */
@Component({
  selector: 'app-admin-dashboard',
  imports: [TranslatePipe, PageHeader, StatCard, DataTable],
  templateUrl: './admin-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly dashboardApi = inject(DashboardApi);
  private readonly session = inject(SessionStore);
  private readonly translation = inject(TranslationService);

  protected readonly icons = {
    projects: LucideBuilding2,
    requests: LucideFileText,
    contractors: LucideUsers,
    funds: LucideWallet,
  };

  private readonly dashboard = rxResource({
    stream: () => this.dashboardApi.getAdminDashboard(),
  });

  protected readonly loading = computed(() => this.dashboard.isLoading());
  protected readonly data = computed(() => this.dashboard.value() ?? null);
  protected readonly failed = computed(() => this.dashboard.error() !== undefined);

  protected readonly greeting = computed(() => {
    const user = this.session.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  protected readonly recentRequests = computed(() => this.data()?.recentRequests ?? []);

  /** Phases with nothing in them are noise on a dashboard. */
  protected readonly activePhases = computed(() =>
    (this.data()?.projectsByPhase ?? []).filter((phase) => phase.count > 0),
  );

  protected readonly requestColumns: DataTableColumn<DashboardRequestRow>[] = [
    {
      key: 'requestNumber',
      headerKey: 'dashboard.admin.table.request',
      cell: (row) => row.requestNumber,
      sortable: true,
    },
    {
      key: 'governorate',
      headerKey: 'dashboard.admin.table.governorate',
      cell: (row) => (row.governorate ? this.translate(`governorates.${row.governorate}`) : '—'),
      sortable: true,
    },
    {
      key: 'severity',
      headerKey: 'dashboard.admin.table.severity',
      cell: (row) => this.translate(`master.severity.${row.severity}`),
      sortable: true,
    },
    {
      key: 'status',
      headerKey: 'dashboard.admin.table.status',
      cell: (row) => this.translate(`shared.statusPill.request.${row.status}`),
      sortable: true,
    },
    {
      key: 'createdAt',
      headerKey: 'dashboard.admin.table.received',
      cell: (row) => this.formatDate(row.createdAt),
      // Sort on the raw ISO string — the formatted Arabic date does not sort.
      sortValue: (row) => row.createdAt,
      sortable: true,
      hideOnMobile: true,
    },
  ];

  protected readonly trackRequest = (row: DashboardRequestRow): string => row.id;

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

  private formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }

  private translate(key: string): string {
    return this.translation.translate(key);
  }
}
