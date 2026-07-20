import { Injectable, signal } from '@angular/core';

/** Mobile off-canvas sidebar drawer open/closed state, shared by Header (toggle) and Sidebar (render). */
@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((value) => !value);
  }
}
