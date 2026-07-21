import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TERMS_AUDIENCES, TermsAudience, TermsDocument } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { SettingsApi } from '@core/api/settings-api.service';
import { DialogShell } from '@shared/ui/dialog/dialog-shell';

/** Absent `doc` means "create". */
export interface TermsDialogData {
  doc?: TermsDocument;
}

/**
 * Create/edit a terms document. Editing an existing document creates no new
 * version by itself — versioning is manual (the author bumps the version
 * label), which keeps the accepted-version audit honest.
 */
@Component({
  selector: 'app-terms-dialog',
  imports: [ReactiveFormsModule, TranslatePipe, DialogShell],
  templateUrl: './terms-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsDialog {
  private readonly data = inject<TermsDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<TermsDocument>>(DialogRef);
  private readonly api = inject(SettingsApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly audiences = TERMS_AUDIENCES;
  protected readonly isEdit = !!this.data.doc;
  protected readonly titleKey = this.isEdit ? 'settings.terms.editTitle' : 'settings.terms.addTitle';
  protected readonly submitting = signal(false);

  protected readonly form = new FormGroup({
    title: new FormControl(this.data.doc?.title ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    audience: new FormControl<TermsAudience>(this.data.doc?.audience ?? 'general', {
      nonNullable: true,
    }),
    version: new FormControl(this.data.doc?.version ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    body: new FormControl(this.data.doc?.body ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20)],
    }),
  });

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
      title: value.title.trim(),
      audience: value.audience,
      version: value.version.trim(),
      body: value.body.trim(),
    };

    this.submitting.set(true);
    const request = this.data.doc
      ? this.api.updateTerms(this.data.doc.id, input)
      : this.api.createTerms(input);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.submitting.set(false);
        this.dialogRef.close(saved);
      },
      error: () => this.submitting.set(false),
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
