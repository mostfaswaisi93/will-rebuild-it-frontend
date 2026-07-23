import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideBell, LucideCheckCheck, LucideTrash2 } from '@lucide/angular';
import { AppNotification } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { NotificationsApi } from '@core/api/notifications-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Notification centre — port of the legacy `notificationsList`. Reuses the
 * existing `NotificationsApi` from the customer app; the operator sees platform
 * updates (new requests, approvals due, faults reported) and can mark them read
 * or clear them.
 */
@Component({
  selector: 'app-notification-list',
  imports: [RouterLink, LucideBell, LucideCheckCheck, LucideTrash2, TranslatePipe, PageHeader],
  templateUrl: './notification-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationList {
  private readonly session = inject(SessionStore);

  /** Only platform operators can broadcast — mirrors the route guard. */
  protected readonly canBroadcast = computed(() => this.session.role() === 'admin');

  private readonly api = inject(NotificationsApi);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({ stream: () => this.api.getNotifications() });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly notifications = computed<AppNotification[]>(() => this.resource.value() ?? []);
  protected readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length,
  );

  protected markRead(notification: AppNotification): void {
    if (notification.isRead) {
      return;
    }
    this.api
      .markRead(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.patch(notification.id, { isRead: true }),
        error: () => this.toast.danger('common.errorGeneric'),
      });
  }

  protected markAllRead(): void {
    this.api
      .markAllRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (all) => this.resource.set(all),
        error: () => this.toast.danger('common.errorGeneric'),
      });
  }

  protected remove(notification: AppNotification): void {
    this.api
      .remove(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resource.set(this.notifications().filter((item) => item.id !== notification.id));
          this.toast.success('notifications.list.removed');
        },
        error: () => this.toast.danger('common.errorGeneric'),
      });
  }

  private patch(id: string, changes: Partial<AppNotification>): void {
    this.resource.set(
      this.notifications().map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  protected relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60000);
    const rtf = new Intl.RelativeTimeFormat(this.translation.locale(), { numeric: 'auto' });
    if (minutes < 60) {
      return rtf.format(-minutes, 'minute');
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return rtf.format(-hours, 'hour');
    }
    return rtf.format(-Math.round(hours / 24), 'day');
  }
}
