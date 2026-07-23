import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideWarehouse } from '@lucide/angular';
import { Warehouse } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { InventoryApi } from '@core/api/inventory-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Warehouse register — port of the legacy `locationlist`. A short reference
 * list of the stores materials are held in; rendered as cards since there are
 * only a handful and each carries a manager and location.
 */
@Component({
  selector: 'app-warehouse-list',
  imports: [RouterLink, LucideWarehouse, TranslatePipe, PageHeader],
  templateUrl: './warehouse-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseList {
  private readonly api = inject(InventoryApi);

  private readonly resource = rxResource({ stream: () => this.api.getWarehouses() });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly warehouses = computed<Warehouse[]>(() => this.resource.value() ?? []);
  protected readonly skeletons = [0, 1, 2];
}
