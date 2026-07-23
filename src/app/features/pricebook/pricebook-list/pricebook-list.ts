import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucidePencil, LucidePlus, LucidePower } from '@lucide/angular';
import { BoqCategory, PricebookItem } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { PricebookApi } from '@core/api/pricebook-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { DataTable, DataTableColumn } from '@shared/ui/data-table/data-table';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import {
  PricebookItemDialog,
  PricebookItemDialogData,
} from '../pricebook-item-dialog/pricebook-item-dialog';

const PAGE_SIZE = 12;
const CATEGORIES: BoqCategory[] = ['materials', 'labor', 'equipment', 'custom'];

/**
 * The pricebook catalogue — port of the legacy `pricebook-list`, reduced to the
 * reconstruction essentials: code, category, description, unit, rate, active.
 * The legacy page's marketplace fields (lead cost, before/after photos, colour,
 * documents, Excel import/export) are dropped with the marketplace they served.
 *
 * Items are deactivated rather than deleted, so historical estimates that cite
 * a superseded rate stay intact — hence a status toggle, not a delete.
 */
@Component({
  selector: 'app-pricebook-list',
  imports: [LucidePencil, LucidePlus, LucidePower, TranslatePipe, DataTable, FilterBar, PageHeader],
  templateUrl: './pricebook-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricebookList {
  private readonly session = inject(SessionStore);

  /**
   * Contractors read the rate book — their estimates are built on it — but only
   * an operator may change it. A contractor editing the rates their own
   * statements are reviewed against would undermine the review.
   */
  protected readonly canManage = computed(() => this.session.role() === 'admin');

  private readonly api = inject(PricebookApi);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = CATEGORIES;

  protected readonly search = signal('');
  protected readonly category = signal<BoqCategory | ''>('');
  protected readonly active = signal('');
  protected readonly pageNo = signal(1);
  /** Bumped to force a reload after a mutation. */
  private readonly reloadTick = signal(0);

  private readonly page = rxResource({
    params: () => ({
      pageNo: this.pageNo(),
      pageSize: PAGE_SIZE,
      searchKey: this.search().trim() || undefined,
      category: this.category() || undefined,
      active: this.active() || undefined,
      tick: this.reloadTick(),
    }),
    stream: ({ params }) => this.api.list(params),
  });

  constructor() {
    effect(() => {
      this.search();
      this.category();
      this.active();
      this.pageNo.set(1);
    });
  }

  protected readonly loading = computed(() => this.page.isLoading());
  protected readonly failed = computed(() => this.page.error() !== undefined);
  protected readonly rows = computed(() => this.page.value()?.items ?? []);
  protected readonly totalCount = computed(() => this.page.value()?.totalCount ?? 0);

  protected readonly columns: DataTableColumn<PricebookItem>[] = [
    { key: 'code', headerKey: 'pricebook.columns.code', cell: (row) => row.code },
    {
      key: 'category',
      headerKey: 'pricebook.columns.category',
      cell: (row) => this.t(`estimates.category.${row.category}`),
    },
    { key: 'description', headerKey: 'pricebook.columns.description', cell: (row) => row.description },
    {
      key: 'unit',
      headerKey: 'pricebook.columns.unit',
      cell: (row) => this.t(`units.${row.unit}`),
      hideOnMobile: true,
    },
    {
      key: 'unitRate',
      headerKey: 'pricebook.columns.rate',
      cell: (row) => this.money(row.unitRate),
      align: 'end',
    },
    {
      key: 'active',
      headerKey: 'pricebook.columns.status',
      cell: (row) => this.t(row.active ? 'pricebook.active' : 'pricebook.inactive'),
    },
  ];

  protected readonly rowId = (row: PricebookItem): string => row.id;

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected clearFilters(): void {
    this.category.set('');
    this.active.set('');
    this.search.set('');
  }

  protected add(): void {
    this.openDialog({});
  }

  protected edit(item: PricebookItem): void {
    this.openDialog({ item });
  }

  private openDialog(data: PricebookItemDialogData): void {
    this.dialog
      .open<PricebookItem, PricebookItemDialogData>(PricebookItemDialog, { data })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this.toast.success(data.item ? 'pricebook.updated' : 'pricebook.created');
          this.reload();
        }
      });
  }

  protected toggleActive(item: PricebookItem): void {
    this.api
      .setActive(item.id, !item.active)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(item.active ? 'pricebook.deactivated' : 'pricebook.activated');
          this.reload();
        },
        error: () => this.toast.danger('common.errorGeneric'),
      });
  }

  private reload(): void {
    this.reloadTick.update((tick) => tick + 1);
  }

  protected money(amount: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
