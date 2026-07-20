import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DialogShell } from '../dialog/dialog-shell';
import { TranslatePipe } from '@core/i18n/translate.pipe';

export interface ConfirmDialogData {
  titleKey: string;
  bodyKey: string;
  bodyParams?: Record<string, string | number>;
  confirmKey?: string;
  cancelKey?: string;
  tone?: 'default' | 'danger';
}

/**
 * Destructive/important confirmation prompt (e.g. "sign out", "reject
 * estimate"). Open via `DialogService.open(ConfirmDialog, { data: {...} })`;
 * the returned observable emits `true` on confirm, `false` on explicit
 * cancel, and `undefined` if dismissed via the shell's close button, the
 * backdrop, or Escape.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogShell, TranslatePipe],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);

  private readonly dialogRef = inject(DialogRef<boolean>);

  protected readonly confirmKey = this.data.confirmKey ?? 'common.confirm';
  protected readonly cancelKey = this.data.cancelKey ?? 'common.cancel';
  protected readonly isDanger = this.data.tone === 'danger';

  confirm(): void {
    this.dialogRef.close(true);
  }

  dismiss(): void {
    this.dialogRef.close(false);
  }
}
