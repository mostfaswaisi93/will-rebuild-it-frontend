import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Lets a page override how one column renders, keyed by column key:
 *
 * ```html
 * <ng-template appDataTableCell="status" let-row>
 *   <app-status-pill [tone]="toneFor(row)" [label]="row.status" />
 * </ng-template>
 * ```
 *
 * Columns without an override fall back to the plain `cell(row)` string. This
 * is what replaces the legacy Syncfusion `ng-template #template` column
 * customisation without dragging in a grid library.
 */
@Directive({ selector: '[appDataTableCell]' })
export class DataTableCellDef {
  /** Key of the `DataTableColumn` this template renders. */
  readonly appDataTableCell = input.required<string>();

  readonly template = inject<TemplateRef<DataTableCellContext>>(TemplateRef);
}

export interface DataTableCellContext {
  $implicit: unknown;
  row: unknown;
}
