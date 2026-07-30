import { InjectionToken, Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/portal';
import type { Observable } from 'rxjs';

export interface DialogOpenConfig<TData = unknown> {
  data?: TData;
}

/**
 * The id `DialogShell` must put on its heading. `DialogService` mints it per
 * open and hands it to both sides: to the CDK container as `ariaLabelledBy`,
 * and to the content component through this token. Neither side has to know
 * the other, and no call site has to remember anything.
 */
export const DIALOG_TITLE_ID = new InjectionToken<string>('DIALOG_TITLE_ID');

/**
 * Thin, app-facing wrapper around `@angular/cdk/dialog`'s `Dialog` service.
 * Opens a standalone component as dialog content and returns its `closed`
 * observable, typed to the result the caller expects back. Overlay
 * positioning comes from `@angular/cdk/overlay-prebuilt.css`, imported
 * globally in `src/styles.css`.
 *
 * Naming is handled here rather than left to callers. CDK renders
 * `[attr.aria-labelledby]="_config.ariaLabel ? null : _ariaLabelledByQueue[0]"`,
 * and the queue is seeded from `ariaLabelledBy` — so a dialog opened without
 * either has `role="dialog"` and **no accessible name**, which a screen reader
 * announces as a bare "dialog". That was true of all four dialogs in this app:
 * the config carried an unused `ariaLabel` option that no call site passed,
 * while the title sat in an `<h2>` a few lines away in `DialogShell`. Wiring it
 * per call site would only have moved the chance to forget, so the id is minted
 * here and `DialogShell.titleKey` is required — a dialog cannot now be built
 * without a name, and the compiler is what enforces it.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<TResult, TData = unknown>(
    component: ComponentType<unknown>,
    config?: DialogOpenConfig<TData>,
  ): Observable<TResult | undefined> {
    // Unique per open: dialogs can stack, and a duplicated id would point every
    // one of them at the first dialog's heading.
    const titleId = `grp-dialog-title-${crypto.randomUUID().slice(0, 8)}`;

    const dialogRef = this.dialog.open<TResult, TData>(component, {
      data: config?.data,
      ariaLabelledBy: titleId,
      // CDK defaults this to false, which contradicts how these dialogs behave:
      // they take a backdrop, trap focus and close on escape. Left false, a
      // screen reader lets the virtual cursor wander out into the page behind —
      // reading a form the user cannot actually reach, because focus is held in
      // here. Declaring the modality matches the announcement to the behaviour.
      ariaModal: true,
      providers: () => [{ provide: DIALOG_TITLE_ID, useValue: titleId }],
      panelClass: ['grp-dialog-panel'],
      backdropClass: ['grp-dialog-backdrop'],
    });

    return dialogRef.closed;
  }
}
