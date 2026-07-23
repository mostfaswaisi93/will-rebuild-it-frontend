import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  MATERIAL_CATEGORIES,
  MaterialCategory,
  Supplier,
  UNITS_OF_MEASURE,
  Warehouse,
} from '@core/models';
import { InventoryApi } from '@core/api/inventory-api.service';
import { SuppliersApi } from '@core/api/suppliers-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Raise a purchase order — port of the legacy `createPo`. The order is created
 * in `draft`; approval and receiving happen through the transition actions on
 * the detail page, so this form only captures who, where and what.
 */
@Component({
  selector: 'app-purchase-order-new',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader],
  templateUrl: './purchase-order-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderNew {
  private readonly api = inject(InventoryApi);
  private readonly suppliersApi = inject(SuppliersApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = MATERIAL_CATEGORIES;
  protected readonly units = UNITS_OF_MEASURE;
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  private readonly suppliersResource = rxResource({
    stream: () => this.suppliersApi.list({ pageNo: 1, pageSize: 100 }),
  });
  private readonly warehousesResource = rxResource({
    stream: () => this.api.getWarehouses(),
  });

  protected readonly suppliers = computed<Supplier[]>(
    () => this.suppliersResource.value()?.items ?? [],
  );
  protected readonly warehouses = computed<Warehouse[]>(() => this.warehousesResource.value() ?? []);

  protected readonly form = this.fb.nonNullable.group({
    supplierId: ['', Validators.required],
    warehouseId: ['', Validators.required],
    expectedDelivery: [''],
    lines: this.fb.nonNullable.array([this.newLine()]),
  });

  /** Bumped on value changes so the subtotal recomputes. */
  private readonly formVersion = signal(0);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formVersion.update((v) => v + 1));
  }

  protected get lines(): FormArray {
    return this.form.controls.lines;
  }

  private newLine() {
    return this.fb.nonNullable.group({
      description: ['', Validators.required],
      category: ['cement' as MaterialCategory],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unit: ['piece' as string],
      unitRate: [0, [Validators.required, Validators.min(0)]],
    });
  }

  protected addLine(): void {
    this.lines.push(this.newLine());
  }

  protected removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  protected lineAmount(index: number): number {
    this.formVersion();
    const line = this.lines.at(index).getRawValue() as { quantity: number; unitRate: number };
    return (Number(line.quantity) || 0) * (Number(line.unitRate) || 0);
  }

  protected readonly subtotal = computed(() => {
    this.formVersion();
    return (this.lines.getRawValue() as { quantity: number; unitRate: number }[]).reduce(
      (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitRate) || 0),
      0,
    );
  });

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createPurchaseOrder({
        supplierId: raw.supplierId,
        warehouseId: raw.warehouseId,
        expectedDelivery: raw.expectedDelivery
          ? new Date(raw.expectedDelivery).toISOString()
          : undefined,
        lines: raw.lines.map((line) => ({
          description: line.description.trim(),
          category: line.category,
          quantity: Number(line.quantity),
          unit: line.unit,
          unitRate: Number(line.unitRate),
        })),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.saving.set(false);
          this.toast.success('purchaseOrders.form.created');
          void this.router.navigate(['/app/purchase-orders', order.id]);
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected money(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
