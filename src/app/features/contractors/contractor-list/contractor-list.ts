import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideShieldCheck, LucideStar } from '@lucide/angular';
import { GAZA_GOVERNORATES, Team } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Paginator } from '@shared/ui/paginator/paginator';
import { SPECIALIZATIONS, specializationKey } from '../contractor-spec';

const PAGE_SIZE = 9;

/**
 * Contractor (reconstruction-team) directory — the operator's view of the firms
 * available to take work, port of the legacy `pro/prolist`. Rendered as profile
 * cards rather than a table: an operator picking a team scans capability and
 * standing (rating, licensed/insured, workload), which reads better as cards.
 */
@Component({
  selector: 'app-contractor-list',
  imports: [
    RouterLink,
    LucideShieldCheck,
    LucideStar,
    TranslatePipe,
    FilterBar,
    PageHeader,
    Paginator,
  ],
  templateUrl: './contractor-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractorList {
  private readonly api = inject(TeamsApi);
  private readonly translation = inject(TranslationService);

  protected readonly specializations = SPECIALIZATIONS;
  protected readonly governorates = GAZA_GOVERNORATES;

  protected readonly search = signal('');
  protected readonly specialization = signal('');
  protected readonly governorate = signal('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      specialization: this.specialization() || undefined,
      governorate: this.governorate() || undefined,
    }),
    stream: ({ params }) => this.api.getTeams(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.specialization();
      this.governorate();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly teams = computed<Team[]>(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly pageSize = PAGE_SIZE;
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.specialization.set('');
    this.governorate.set('');
    this.search.set('');
  }

  protected specKey(value: string): string {
    return specializationKey(value);
  }

  protected rating(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }
}
