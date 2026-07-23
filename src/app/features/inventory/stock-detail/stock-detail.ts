import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StockItem } from '@core/models';
import { InventoryApi } from '@core/api/inventory-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/** One material's on-hand position at one store — port of the legacy
 * `inventorydetails`. */
@Component({
  selector: 'app-stock-detail',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './stock-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockDetail {
  readonly id = input.required<string>();

  private readonly api = inject(InventoryApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getStockItem(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly item = computed<StockItem | null>(() => this.resource.value() ?? null);

  /** How far on-hand sits above the reorder level, 0–1, for the gauge. */
  protected readonly cover = computed(() => {
    const item = this.item();
    if (!item || item.reorderLevel <= 0) {
      return item && item.quantityOnHand > 0 ? 1 : 0;
    }
    return Math.min(1, item.quantityOnHand / (item.reorderLevel * 2));
  });

  protected readonly belowReorder = computed(() => {
    const item = this.item();
    return !!item && item.quantityOnHand <= item.reorderLevel;
  });

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }
}
