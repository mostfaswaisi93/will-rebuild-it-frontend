import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  contentChildren,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideArrowDownUp,
  LucideChevronDown,
  LucideChevronUp,
  LucideDownload,
  LucideSearch,
  LucideSettings2,
} from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { Paginator } from '../paginator/paginator';
import { DataTableCellDef } from './data-table-cell.directive';

export type SortDirection = 'asc' | 'desc';

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  key: string;
  headerKey: string;
  /** Plain-text projection of the cell — also what search and CSV export use,
   * even when an `appDataTableCell` template overrides the visual rendering. */
  cell: (row: T) => string;
  align?: 'start' | 'end' | 'center';
  sortable?: boolean;
  /** Sort key when the display string sorts wrongly (dates, money, numbers). */
  sortValue?: (row: T) => string | number;
  /** Hidden by default; the user can re-enable it from the columns menu. */
  hidden?: boolean;
  /** Kept out of the stacked mobile card to avoid noise on small screens. */
  hideOnMobile?: boolean;
  widthClass?: string;
}

/**
 * The portal's one tabular list — the replacement for the legacy Syncfusion
 * Grid that ~40 screens depended on.
 *
 * Sorting, searching and pagination run client-side by default, which is what
 * most ported screens want (they already fetch a bounded list). Set
 * `serverSide` to hand those three concerns back to the caller: the component
 * then renders `rows()` verbatim and only emits `sortChange` / `searchChange` /
 * `pageChange`, with `totalCount` driving the paginator.
 *
 * Renders a real `<table>` from `md:` up and stacked "label: value" cards below
 * it, so small screens never scroll horizontally.
 */
@Component({
  selector: 'app-data-table',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    TranslatePipe,
    Paginator,
    LucideArrowDownUp,
    LucideChevronDown,
    LucideChevronUp,
    LucideDownload,
    LucideSearch,
    LucideSettings2,
  ],
  templateUrl: './data-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  readonly rowLink = input<(row: T) => string | undefined>();
  readonly trackByFn = input<(row: T) => string>();

  /** Stable id per row. Required for selection; falls back to the row index. */
  readonly rowId = input<(row: T) => string>();

  readonly selectable = input(false);
  readonly searchable = input(false);
  readonly exportable = input(false);
  readonly columnPicker = input(false);
  readonly exportFileName = input('export');

  /** 0 disables pagination. */
  readonly pageSize = input(0);

  /** Hand sorting/searching/paging to the caller. */
  readonly serverSide = input(false);
  /** Server-side total; ignored when `serverSide` is false. */
  readonly totalCount = input(0);

  readonly sortChange = output<DataTableSort | null>();
  readonly searchChange = output<string>();
  readonly pageChange = output<number>();
  readonly selectionChange = output<string[]>();

  private readonly cellDefs = contentChildren(DataTableCellDef);
  protected readonly rowActions = contentChild<TemplateRef<{ $implicit: T }>>('rowActions');
  protected readonly toolbarExtra = contentChild<TemplateRef<unknown>>('toolbarExtra');

  protected readonly sort = signal<DataTableSort | null>(null);
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly hiddenKeys = signal<ReadonlySet<string>>(new Set());
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly columnsMenuOpen = signal(false);

  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];

  constructor() {
    // Seed the hidden set from the column definitions, once per definition
    // change. Written untracked so a user toggling a column doesn't loop back
    // through this effect and get reset to the defaults.
    effect(() => {
      const defaults = this.columns()
        .filter((column) => column.hidden === true)
        .map((column) => column.key);
      untracked(() => this.hiddenKeys.set(new Set(defaults)));
    });
  }

  protected readonly visibleColumns = computed(() => {
    const hidden = this.hiddenKeys();
    return this.columns().filter((column) => !hidden.has(column.key));
  });

  protected readonly mobileColumns = computed(() =>
    this.visibleColumns().filter((column) => column.hideOnMobile !== true),
  );

  /** rows → search → sort. Pagination is applied separately so CSV export and
   * the "select all" checkbox can act on the full filtered set, not just the
   * visible page. */
  private readonly processedRows = computed(() => {
    if (this.serverSide()) {
      return this.rows();
    }

    const term = this.query().trim().toLocaleLowerCase();
    const columns = this.visibleColumns();

    const filtered = term
      ? this.rows().filter((row) =>
          columns.some((column) => column.cell(row).toLocaleLowerCase().includes(term)),
        )
      : this.rows();

    const activeSort = this.sort();
    if (!activeSort) {
      return filtered;
    }

    const column = this.columns().find((candidate) => candidate.key === activeSort.key);
    if (!column) {
      return filtered;
    }

    const read = column.sortValue ?? column.cell;
    const factor = activeSort.direction === 'asc' ? 1 : -1;

    // Copy before sorting: `rows()` is an input array the caller still owns.
    return [...filtered].sort((left, right) => {
      const a = read(left);
      const b = read(right);
      if (typeof a === 'number' && typeof b === 'number') {
        return (a - b) * factor;
      }
      // `ar` collation so Arabic names order correctly, with numeric-aware
      // comparison so "بند 2" precedes "بند 10".
      return String(a).localeCompare(String(b), 'ar', { numeric: true }) * factor;
    });
  });

  protected readonly effectiveTotal = computed(() =>
    this.serverSide() ? this.totalCount() : this.processedRows().length,
  );

  protected readonly displayRows = computed(() => {
    const size = this.pageSize();
    if (this.serverSide() || size <= 0) {
      return this.processedRows();
    }
    const start = (this.page() - 1) * size;
    return this.processedRows().slice(start, start + size);
  });

  protected readonly showPaginator = computed(
    () => this.pageSize() > 0 && this.effectiveTotal() > this.pageSize(),
  );

  protected readonly showToolbar = computed(
    () => this.searchable() || this.exportable() || this.columnPicker() || !!this.toolbarExtra(),
  );

  protected readonly allOnPageSelected = computed(() => {
    const rows = this.displayRows();
    if (rows.length === 0) {
      return false;
    }
    const selected = this.selectedIds();
    return rows.every((row, index) => selected.has(this.idFor(row, index)));
  });

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  // --- interaction ---------------------------------------------------------

  protected toggleSort(column: DataTableColumn<T>): void {
    if (column.sortable !== true) {
      return;
    }
    const current = this.sort();
    // asc → desc → unsorted, so a user can always get back to source order.
    const next: DataTableSort | null =
      current?.key !== column.key
        ? { key: column.key, direction: 'asc' }
        : current.direction === 'asc'
          ? { key: column.key, direction: 'desc' }
          : null;

    this.sort.set(next);
    this.page.set(1);
    this.sortChange.emit(next);
  }

  protected sortStateFor(key: string): SortDirection | null {
    const current = this.sort();
    return current?.key === key ? current.direction : null;
  }

  protected onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
    this.searchChange.emit(value);
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
    this.pageChange.emit(page);
  }

  protected toggleColumn(key: string): void {
    const next = new Set(this.hiddenKeys());
    if (!next.delete(key)) {
      next.add(key);
    }
    this.hiddenKeys.set(next);
  }

  protected isHidden(key: string): boolean {
    return this.hiddenKeys().has(key);
  }

  protected toggleRow(row: T, index: number): void {
    const id = this.idFor(row, index);
    const next = new Set(this.selectedIds());
    if (!next.delete(id)) {
      next.add(id);
    }
    this.selectedIds.set(next);
    this.selectionChange.emit([...next]);
  }

  protected isRowSelected(row: T, index: number): boolean {
    return this.selectedIds().has(this.idFor(row, index));
  }

  protected toggleAllOnPage(): void {
    const rows = this.displayRows();
    const next = new Set(this.selectedIds());
    const shouldSelect = !this.allOnPageSelected();
    rows.forEach((row, index) => {
      const id = this.idFor(row, index);
      if (shouldSelect) {
        next.add(id);
      } else {
        next.delete(id);
      }
    });
    this.selectedIds.set(next);
    this.selectionChange.emit([...next]);
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
    this.selectionChange.emit([]);
  }

  /** Exports the full filtered/sorted set, not just the current page. */
  protected exportCsv(): void {
    const columns = this.visibleColumns();
    const header = columns.map((column) => this.csvCell(column.headerKey));
    const body = this.processedRows().map((row) =>
      columns.map((column) => this.csvCell(column.cell(row))).join(','),
    );
    // Excel only reads a UTF-8 CSV as Arabic if it starts with a BOM.
    const csv = `\uFEFF${[header.join(','), ...body].join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.exportFileName()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // --- rendering helpers ---------------------------------------------------

  protected templateFor(key: string): TemplateRef<{ $implicit: T; row: T }> | null {
    const match = this.cellDefs().find((def) => def.appDataTableCell() === key);
    return (match?.template as TemplateRef<{ $implicit: T; row: T }> | undefined) ?? null;
  }

  protected trackRow(row: T, index: number): string | number {
    const fn = this.trackByFn();
    return fn ? fn(row) : this.idFor(row, index);
  }

  protected alignClass(align: DataTableColumn<T>['align']): string {
    if (align === 'end') {
      return 'text-end';
    }
    if (align === 'center') {
      return 'text-center';
    }
    return 'text-start';
  }

  protected linkFor(row: T): string | undefined {
    const fn = this.rowLink();
    return fn ? fn(row) : undefined;
  }

  protected rowClasses(row: T): string {
    const base = 'border-b border-ink-300/60 last:border-b-0';
    return this.linkFor(row)
      ? `${base} cursor-pointer hover:bg-surface-container-low focus-visible:bg-surface-container-low`
      : base;
  }

  protected cardClasses(row: T): string {
    const base = 'rounded-card border border-ink-300 bg-surface p-4';
    return this.linkFor(row)
      ? `${base} cursor-pointer hover:border-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500`
      : base;
  }

  private idFor(row: T, index: number): string {
    const fn = this.rowId();
    return fn ? fn(row) : String(index);
  }

  private csvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }
}
