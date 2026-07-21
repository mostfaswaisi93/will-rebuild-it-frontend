import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BoqCategory, PricebookItem, UNITS_OF_MEASURE } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PricebookApi } from '@core/api/pricebook-api.service';
import { DialogShell } from '@shared/ui/dialog/dialog-shell';

/** Passed in `data`; absent `item` means "create". */
export interface PricebookItemDialogData {
  item?: PricebookItem;
}

const CATEGORIES: BoqCategory[] = ['materials', 'labor', 'equipment', 'custom'];

/**
 * Create/edit a pricebook item. Opened via `DialogService.open()`; closes with
 * the saved item on success, or `undefined` if cancelled. A duplicate code is a
 * field-level error (409) shown inline, not a toast — it's a fixable mistake.
 */
@Component({
  selector: 'app-pricebook-item-dialog',
  imports: [ReactiveFormsModule, TranslatePipe, DialogShell],
  templateUrl: './pricebook-item-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricebookItemDialog {
  private readonly data = inject<PricebookItemDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<PricebookItem>>(DialogRef);
  private readonly api = inject(PricebookApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = CATEGORIES;
  protected readonly units = UNITS_OF_MEASURE;
  protected readonly isEdit = !!this.data.item;
  protected readonly titleKey = this.isEdit ? 'pricebook.dialog.editTitle' : 'pricebook.dialog.addTitle';

  protected readonly submitting = signal(false);
  protected readonly codeTaken = signal(false);

  protected readonly form = new FormGroup({
    code: new FormControl(this.data.item?.code ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl<BoqCategory>(this.data.item?.category ?? 'materials', {
      nonNullable: true,
    }),
    description: new FormControl(this.data.item?.description ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    unit: new FormControl(this.data.item?.unit ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    unitRate: new FormControl<number | null>(this.data.item?.unitRate ?? null, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  constructor() {
    this.form.controls.code.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.codeTaken.set(false));
  }

  protected save(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input = {
      code: value.code.trim(),
      category: value.category,
      description: value.description.trim(),
      unit: value.unit,
      // Required + min(0) validated above.
      unitRate: value.unitRate as number,
    };

    this.submitting.set(true);
    const request = this.data.item
      ? this.api.update(this.data.item.id, input)
      : this.api.create(input);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.submitting.set(false);
        this.dialogRef.close(saved);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        if (error.status === 409) {
          this.codeTaken.set(true);
          this.form.controls.code.markAsTouched();
        }
      },
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
