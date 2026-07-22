import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CAMPAIGN_STATUSES, Campaign, CampaignStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { CampaignsApi } from '@core/api/campaigns-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/** Outreach-campaign register — port of the legacy `promotions/promotionlist`. */
@Component({
  selector: 'app-campaign-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './campaign-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignList {
  private readonly api = inject(CampaignsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = CAMPAIGN_STATUSES;

  protected readonly search = signal('');
  protected readonly status = signal<CampaignStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
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

  protected readonly columns: DataTableColumn<Campaign>[] = [
    { key: 'name', headerKey: 'campaigns.columns.name', cell: (row) => row.name },
    {
      key: 'audience',
      headerKey: 'campaigns.columns.audience',
      cell: (row) => this.t(`campaigns.audience.${row.audience}`),
    },
    {
      key: 'channel',
      headerKey: 'campaigns.columns.channel',
      cell: (row) => this.t(`campaigns.channel.${row.channel}`),
      hideOnMobile: true,
    },
    {
      key: 'reach',
      headerKey: 'campaigns.columns.reach',
      cell: (row) => `${this.count(row.sentCount)} / ${this.count(row.audienceSize)}`,
      align: 'end',
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'campaigns.columns.status',
      cell: (row) => this.t(`shared.statusPill.campaign.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: Campaign): string => `/app/campaigns/${row.id}`;
  protected readonly rowId = (row: Campaign): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
