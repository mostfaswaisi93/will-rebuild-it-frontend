import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SubscriptionsApi } from '@core/api/subscriptions-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { resolvePlanParam } from '../plan-param.util';

const PAGE_SIZE = 10;

/**
 * Contractor membership register — the reconstruction reframe of the legacy
 * Vanlynk/Leadgen subscription lists. One row per contracting team, with the
 * summary strip reporting active memberships, overdue renewals, and annualised
 * membership revenue.
 */
@Component({
  selector: 'app-subscription-list',
  imports: [RouterLink, TranslatePipe, DataTable, FilterBar, PageHeader, StatCard, StatusPill],
  templateUrl: './subscription-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionList {
  private readonly api = inject(SubscriptionsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = SUBSCRIPTION_STATUSES;
  protected readonly plans = SUBSCRIPTION_PLANS;

  /**
   * `?plan=` deep link, bound by `withComponentInputBinding()`. The plans
   * catalogue links here per tier, so the param has to actually drive the
   * filter — otherwise the link reads as "show me this tier" and silently
   * serves the whole register.
   */
  readonly plan = input<string | undefined>(undefined);

  protected readonly search = signal('');
  protected readonly status = signal<SubscriptionStatus | ''>('');
  /** The live filter. Seeded from the `plan` input, then owned by the select. */
  protected readonly planFilter = signal<SubscriptionPlan | ''>('');
  protected readonly pageNo = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
      plan: this.planFilter() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    // Seed the filter from the URL. Validated against the union rather than
    // cast, so a hand-edited `?plan=gold` falls back to "all plans" instead of
    // filtering everything out and looking like an empty register.
    effect(() => this.planFilter.set(resolvePlanParam(this.plan())));

    effect(() => {
      this.search();
      this.status();
      this.planFilter();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);

  protected readonly columns: DataTableColumn<Subscription>[] = [
    { key: 'team', headerKey: 'subscriptions.columns.team', cell: (row) => row.teamName },
    {
      key: 'number',
      headerKey: 'subscriptions.columns.number',
      cell: (row) => row.subscriptionNumber,
      hideOnMobile: true,
    },
    {
      key: 'plan',
      headerKey: 'subscriptions.columns.plan',
      cell: (row) => this.t(`subscriptions.plan.${row.plan}`),
    },
    {
      key: 'renewsAt',
      headerKey: 'subscriptions.columns.renewsAt',
      cell: (row) => this.formatDate(row.renewsAt),
      hideOnMobile: true,
    },
    {
      key: 'amount',
      headerKey: 'subscriptions.columns.amount',
      cell: (row) => this.money(row.amount, row.currency),
      align: 'end',
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'subscriptions.columns.status',
      cell: (row) => this.t(`shared.statusPill.subscription.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: Subscription): string => `/app/subscriptions/${row.id}`;
  protected readonly rowId = (row: Subscription): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.planFilter.set('');
    this.search.set('');
  }

  protected money(value: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
