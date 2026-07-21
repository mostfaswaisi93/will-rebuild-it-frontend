import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  BENEFICIARY_STATUSES,
  Beneficiary,
  BeneficiaryStatus,
  GAZA_GOVERNORATES,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { BeneficiariesApi } from '@core/api/beneficiaries-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Beneficiary (household) register — port of the legacy `customer` list. An
 * operator's caseload: who is registered, where, and whether their eligibility
 * is verified. The legacy customer list carried marketplace/booking columns
 * that don't apply; this is the case register.
 */
@Component({
  selector: 'app-beneficiary-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './beneficiary-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeneficiaryList {
  private readonly api = inject(BeneficiariesApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = BENEFICIARY_STATUSES;
  protected readonly governorates = GAZA_GOVERNORATES;

  protected readonly search = signal('');
  protected readonly status = signal<BeneficiaryStatus | ''>('');
  protected readonly governorate = signal('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
      governorate: this.governorate() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.status();
      this.governorate();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<Beneficiary>[] = [
    { key: 'name', headerKey: 'beneficiaries.columns.name', cell: (row) => row.name },
    {
      key: 'governorate',
      headerKey: 'workRequests.columns.governorate',
      cell: (row) => this.t(`governorates.${row.address.governorate}`),
    },
    {
      key: 'familySize',
      headerKey: 'beneficiaries.columns.familySize',
      cell: (row) => this.count(row.familySize),
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'beneficiaries.columns.status',
      cell: (row) => this.t(`shared.statusPill.beneficiary.${row.status}`),
    },
    {
      key: 'registeredAt',
      headerKey: 'beneficiaries.columns.registered',
      cell: (row) => this.formatDate(row.registeredAt),
      hideOnMobile: true,
    },
  ];

  protected readonly rowLink = (row: Beneficiary): string => `/app/beneficiaries/${row.id}`;
  protected readonly rowId = (row: Beneficiary): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.governorate.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
