import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideStar } from '@lucide/angular';
import { MONITORING_SOURCES, MonitoringReport, MonitoringSource } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { MonitoringApi } from '@core/api/monitoring-api.service';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Paginator } from '@shared/ui/paginator/paginator';
import { StatCard } from '@shared/ui/stat-card/stat-card';

const PAGE_SIZE = 10;

/**
 * Independent monitoring reports — the reconstruction analogue of the legacy
 * `social` external ratings. Third-party assessments (UN-Habitat, the
 * Engineers' Syndicate, donor audits, local councils) of delivered projects.
 */
@Component({
  selector: 'app-monitoring-list',
  imports: [RouterLink, LucideStar, TranslatePipe, FilterBar, PageHeader, Paginator, StatCard],
  templateUrl: './monitoring-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringList {
  private readonly api = inject(MonitoringApi);
  private readonly translation = inject(TranslationService);

  protected readonly sources = MONITORING_SOURCES;

  protected readonly search = signal('');
  protected readonly source = signal<MonitoringSource | ''>('');
  protected readonly pageNo = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      source: this.source() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.source();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly reports = computed<MonitoringReport[]>(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);
  protected readonly skeletons = [0, 1, 2, 3];

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.source.set('');
    this.search.set('');
  }

  protected rating(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
