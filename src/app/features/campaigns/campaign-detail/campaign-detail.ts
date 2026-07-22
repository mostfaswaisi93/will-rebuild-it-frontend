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
import { Campaign } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { CampaignsApi } from '@core/api/campaigns-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

@Component({
  selector: 'app-campaign-detail',
  imports: [TranslatePipe, PageHeader, StatusPill],
  templateUrl: './campaign-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignDetail {
  readonly id = input.required<string>();

  private readonly api = inject(CampaignsApi);
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
  protected readonly campaign = computed<Campaign | null>(() => this.resource.value() ?? null);
  protected readonly working = signal(false);

  private readonly isAdmin = computed(() => this.session.role() === 'admin');
  protected readonly canSend = computed(() => {
    const status = this.campaign()?.status;
    return this.isAdmin() && (status === 'draft' || status === 'scheduled');
  });
  protected readonly canCancel = computed(() => {
    const status = this.campaign()?.status;
    return this.isAdmin() && status !== 'completed' && status !== 'cancelled';
  });

  protected readonly progress = computed(() => {
    const c = this.campaign();
    return c && c.audienceSize > 0 ? c.sentCount / c.audienceSize : 0;
  });

  protected send(): void {
    this.run((id) => this.api.send(id), 'campaigns.detail.sent');
  }

  protected cancel(): void {
    this.run((id) => this.api.cancel(id), 'campaigns.detail.cancelled');
  }

  private run(action: (id: string) => ReturnType<CampaignsApi['send']>, successKey: string): void {
    const campaign = this.campaign();
    if (!campaign || this.working()) {
      return;
    }
    this.working.set(true);
    action(campaign.id)
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

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }

  protected percent(value: number): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'percent',
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
