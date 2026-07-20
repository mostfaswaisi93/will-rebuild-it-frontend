import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { LucideX } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Consistent chrome (header with title + close button, scrollable body,
 * footer action slot) for any component opened via `DialogService.open()`.
 * A dialog CONTENT component wraps its own template with `<app-dialog-shell>`.
 *
 * Responsive shape: mobile-first bottom sheet (pinned to the bottom of the
 * viewport, full width, only top corners rounded) that becomes a normal
 * centered modal from `sm:` up. `@angular/cdk/dialog` wraps whatever we
 * render in its own container/pane elements that we don't control much, so
 * this component's own root element uses `fixed` positioning to escape that
 * wrapper visually on mobile, then switches back to a normal in-flow
 * `sm:relative` box once the viewport is wide enough for CDK's default
 * (centering) position strategy to take over.
 */
@Component({
  selector: 'app-dialog-shell',
  imports: [LucideX, TranslatePipe],
  templateUrl: './dialog-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogShell {
  readonly titleKey = input<string>();

  private readonly dialogRef = inject(DialogRef);

  close(): void {
    this.dialogRef.close();
  }
}
