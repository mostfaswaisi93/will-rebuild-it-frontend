import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideStar } from '@lucide/angular';
import { GAZA_GOVERNORATES, GazaGovernorate, Team } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Paginator } from '@shared/ui/paginator/paginator';

const PAGE_SIZE = 9;

/** Directory of reconstruction teams a beneficiary can browse and follow —
 * port of the legacy teams/pros listing. Card grid, backed by `TeamsApi`. */
@Component({
  selector: 'app-team-list',
  imports: [RouterLink, LucideStar, TranslatePipe, FilterBar, PageHeader, Paginator],
  templateUrl: './team-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamList {
  private readonly api = inject(TeamsApi);
  private readonly translation = inject(TranslationService);

  protected readonly governorates = GAZA_GOVERNORATES;

  protected readonly search = signal('');
  protected readonly governorate = signal<GazaGovernorate | ''>('');
  protected readonly pageNo = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      governorate: this.governorate() || undefined,
    }),
    stream: ({ params }) => this.api.getTeams(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.governorate();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly teams = computed<Team[]>(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.governorate.set('');
    this.search.set('');
  }

  protected rating(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }
}
