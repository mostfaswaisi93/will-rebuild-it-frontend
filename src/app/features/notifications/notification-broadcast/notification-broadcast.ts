import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NotificationsApi } from '@core/api/notifications-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Compose a platform announcement — port of the legacy
 * `notifications/push-notifications`. The legacy screen wired a mobile push
 * provider; here the announcement lands in the in-app notification centre,
 * which is the delivery channel this rebuild actually has. Outreach to people
 * *outside* the app (email/SMS) is a campaign, not a notification.
 */
@Component({
  selector: 'app-notification-broadcast',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader],
  templateUrl: './notification-broadcast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBroadcast {
  private readonly api = inject(NotificationsApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sending = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    body: ['', [Validators.required, Validators.minLength(10)]],
    linkUrl: [''],
  });

  protected send(): void {
    if (this.sending()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const { title, body, linkUrl } = this.form.getRawValue();
    this.sending.set(true);
    this.api
      .broadcast({ title: title.trim(), body: body.trim(), linkUrl: linkUrl.trim() || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.toast.success('notifications.broadcast.sent');
          void this.router.navigate(['/app/notifications']);
        },
        error: () => {
          this.sending.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }
}
