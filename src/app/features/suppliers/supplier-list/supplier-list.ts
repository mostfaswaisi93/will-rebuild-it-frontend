import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  GAZA_GOVERNORATES,
  MATERIAL_CATEGORIES,
  MaterialCategory,
  SUPPLIER_STATUSES,
  Supplier,
  SupplierStatus,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SuppliersApi } from '@core/api/suppliers-api.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 10;

/**
 * Materials-supplier register — port of the legacy `vendor` list. The firms the
 * platform procures reconstruction materials from, with their approval standing
 * and the material categories they carry.
 */
@Component({
  selector: 'app-supplier-list',
  imports: [TranslatePipe, DataTable, FilterBar, PageHeader, StatusPill],
  templateUrl: './supplier-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierList {
  private readonly api = inject(SuppliersApi);
  private readonly translation = inject(TranslationService);

  protected readonly statuses = SUPPLIER_STATUSES;
  protected readonly categoriesList = MATERIAL_CATEGORIES;
  protected readonly governorates = GAZA_GOVERNORATES;

  protected readonly search = signal('');
  protected readonly status = signal<SupplierStatus | ''>('');
  protected readonly category = signal<MaterialCategory | ''>('');
  protected readonly governorate = signal('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      status: this.status() || undefined,
      category: this.category() || undefined,
      governorate: this.governorate() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.status();
      this.category();
      this.governorate();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<Supplier>[] = [
    { key: 'name', headerKey: 'suppliers.columns.name', cell: (row) => row.name },
    { key: 'contactName', headerKey: 'suppliers.columns.contact', cell: (row) => row.contactName, hideOnMobile: true },
    {
      key: 'governorate',
      headerKey: 'workRequests.columns.governorate',
      cell: (row) => this.t(`governorates.${row.address.governorate}`),
    },
    {
      key: 'categories',
      headerKey: 'suppliers.columns.categories',
      cell: (row) => row.categories.map((c) => this.t(`materials.${c}`)).join('، '),
    },
    {
      key: 'status',
      headerKey: 'suppliers.columns.status',
      cell: (row) => this.t(`shared.statusPill.supplier.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: Supplier): string => `/app/suppliers/${row.id}`;
  protected readonly rowId = (row: Supplier): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.category.set('');
    this.governorate.set('');
    this.search.set('');
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
