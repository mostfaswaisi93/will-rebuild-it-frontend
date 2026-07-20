import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/portal';
import type { Observable } from 'rxjs';

export interface DialogOpenConfig<TData = unknown> {
  data?: TData;
  ariaLabel?: string;
}

/**
 * Thin, app-facing wrapper around `@angular/cdk/dialog`'s `Dialog` service.
 * Opens a standalone component as dialog content and returns its `closed`
 * observable, typed to the result the caller expects back. Overlay
 * positioning comes from `@angular/cdk/overlay-prebuilt.css`, imported
 * globally in `src/styles.css`.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<TResult, TData = unknown>(
    component: ComponentType<unknown>,
    config?: DialogOpenConfig<TData>,
  ): Observable<TResult | undefined> {
    const dialogRef = this.dialog.open<TResult, TData>(component, {
      data: config?.data,
      ariaLabel: config?.ariaLabel,
      panelClass: ['grp-dialog-panel'],
      backdropClass: ['grp-dialog-backdrop'],
    });

    return dialogRef.closed;
  }
}
