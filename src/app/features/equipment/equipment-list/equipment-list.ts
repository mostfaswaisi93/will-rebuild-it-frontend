import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideCalendarRange } from '@lucide/angular';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { EquipmentApi } from '@core/api/equipment-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatCard } from '@shared/ui/stat-card/stat-card';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

const PAGE_SIZE = 12;

/**
 * Heavy-equipment fleet — port of the legacy `alp-equipment` list. The
 * operator's availability view, headlined by how many machines are free versus
 * committed or down.
 */
@Component({
  selector: 'app-equipment-list',
  imports: [
    RouterLink,
    LucideCalendarRange,
    TranslatePipe,
    DataTable,
    FilterBar,
    PageHeader,
    StatCard,
    StatusPill,
  ],
  templateUrl: './equipment-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentList {
  private readonly api = inject(EquipmentApi);
  private readonly session = inject(SessionStore);

  /** Staff can view the fleet but not register machines — mirrors the route guard. */
  protected readonly canManage = computed(() => {
    const role = this.session.role();
    return role === 'admin' || role === 'contractor';
  });
  private readonly translation = inject(TranslationService);

  protected readonly statuses = EQUIPMENT_STATUSES;
  protected readonly categoriesList = EQUIPMENT_CATEGORIES;

  protected readonly search = signal('');
  protected readonly category = signal<EquipmentCategory | ''>('');
  protected readonly status = signal<EquipmentStatus | ''>('');
  protected readonly pageNo = signal(1);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      category: this.category() || undefined,
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.category();
      this.status();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);
  protected readonly summary = computed(() => this.page.value()?.summary ?? null);

  protected readonly columns: DataTableColumn<Equipment>[] = [
    { key: 'code', headerKey: 'equipment.columns.code', cell: (row) => row.code },
    { key: 'name', headerKey: 'equipment.columns.name', cell: (row) => row.name },
    {
      key: 'category',
      headerKey: 'equipment.columns.category',
      cell: (row) => this.t(`equipment.category.${row.category}`),
      hideOnMobile: true,
    },
    { key: 'location', headerKey: 'equipment.columns.location', cell: (row) => row.location, hideOnMobile: true },
    {
      key: 'dailyRate',
      headerKey: 'equipment.columns.dailyRate',
      cell: (row) => this.money(row.dailyRate, row.currency),
      align: 'end',
    },
    {
      key: 'status',
      headerKey: 'equipment.columns.status',
      cell: (row) => this.t(`shared.statusPill.equipment.${row.status}`),
    },
  ];

  protected readonly rowLink = (row: Equipment): string => `/app/equipment/${row.id}`;
  protected readonly rowId = (row: Equipment): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.category.set('');
    this.status.set('');
    this.search.set('');
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected money(amount: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
