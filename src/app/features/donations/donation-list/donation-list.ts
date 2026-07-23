import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DONATION_STATUSES, Donation, DonationStatus } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { DonationsApi } from '@core/api/donations-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/** The donor's own giving history — port of the legacy donor donations list.
 * Reads `DonationsApi.getMyDonations`. */
@Component({
  selector: 'app-donation-list',
  imports: [RouterLink, TranslatePipe, DataTable, PageHeader, StatusPill],
  templateUrl: './donation-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonationList {
  private readonly api = inject(DonationsApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = DONATION_STATUSES;

  protected readonly status = signal<DonationStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.getMyDonations(params),
  });

  constructor() {
    effect(() => {
      this.status();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<Donation>[] = [
    {
      key: 'amount',
      headerKey: 'donations.detail.amount',
      cell: (row) => this.money(row.amount, row.currency),
    },
    {
      key: 'project',
      headerKey: 'donations.detail.project',
      cell: (row) => row.projectTitle || this.t('donations.general.fund'),
      hideOnMobile: true,
    },
    {
      key: 'frequency',
      headerKey: 'donations.detail.frequency',
      cell: (row) => this.t(`donations.frequency.${row.frequency}`),
      hideOnMobile: true,
    },
    {
      key: 'created',
      headerKey: 'donations.detail.date',
      cell: (row) => this.formatDate(row.createdAt),
      hideOnMobile: true,
    },
    {
      key: 'status',
      headerKey: 'donations.detail.status',
      cell: (row) => this.t(`shared.statusPill.donation.${row.status}`),
    },
  ];

  protected readonly rowId = (row: Donation): string => row.id;
  protected readonly rowLink = (row: Donation): string => `/app/donations/${row.id}`;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  private money(value: number, currency: string): string {
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
