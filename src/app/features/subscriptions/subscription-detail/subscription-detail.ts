import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SubscriptionsApi } from '@core/api/subscriptions-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

@Component({
  selector: 'app-subscription-detail',
  imports: [TranslatePipe, PageHeader, StatusPill],
  templateUrl: './subscription-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionDetail {
  readonly id = input.required<string>();

  private readonly api = inject(SubscriptionsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly subscription = computed<Subscription | null>(() => this.resource.value() ?? null);
  protected readonly working = signal(false);

  private readonly isAdmin = computed(() => this.session.role() === 'admin');
  protected readonly canRenew = computed(
    () => this.isAdmin() && this.subscription()?.status !== 'cancelled',
  );
  protected readonly canCancel = computed(() => {
    const status = this.subscription()?.status;
    return this.isAdmin() && status !== undefined && status !== 'cancelled';
  });

  protected renew(): void {
    this.run((id) => this.api.renew(id), 'subscriptions.detail.renewed');
  }

  protected cancel(): void {
    this.run((id) => this.api.cancel(id), 'subscriptions.detail.cancelled');
  }

  protected refund(paymentId: string): void {
    const subscription = this.subscription();
    if (!subscription || this.working()) {
      return;
    }
    this.working.set(true);
    this.api
      .refundPayment(subscription.id, paymentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.working.set(false);
          this.resource.set(updated);
          this.toast.success('subscriptions.detail.refunded');
        },
        error: () => {
          this.working.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  private run(action: (id: string) => ReturnType<SubscriptionsApi['renew']>, successKey: string): void {
    const subscription = this.subscription();
    if (!subscription || this.working()) {
      return;
    }
    this.working.set(true);
    action(subscription.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.working.set(false);
          this.resource.set(updated);
          this.toast.success(successKey);
        },
        error: () => {
          this.working.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected money(value: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
