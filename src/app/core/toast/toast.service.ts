import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'danger' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  messageKey: string;
  params?: Record<string, string | number>;
}

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<ToastMessage[]>([]);
  readonly all = this.toasts.asReadonly();

  show(tone: ToastTone, messageKey: string, params?: Record<string, string | number>): void {
    const id = crypto.randomUUID();
    this.toasts.update((list) => [...list, { id, tone, messageKey, params }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }

  success(messageKey: string, params?: Record<string, string | number>): void {
    this.show('success', messageKey, params);
  }

  danger(messageKey: string, params?: Record<string, string | number>): void {
    this.show('danger', messageKey, params);
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
