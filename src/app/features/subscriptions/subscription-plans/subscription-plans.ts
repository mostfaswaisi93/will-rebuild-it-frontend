import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MembershipPlan } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SubscriptionsApi } from '@core/api/subscriptions-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * The membership tier catalogue — port of the legacy `priceList/plans-price-list`,
 * which was that module's default screen. Only its sibling
 * (`services-price-list` → `/app/price-lists`) had been carried over, so the
 * `plan` field every membership holds, and the plan filter on
 * `/app/subscriptions`, referred to tiers documented nowhere in the app.
 *
 * Read-only, like `/app/price-lists`: a fee change is a commercial decision
 * taken outside the platform, and editing it here would silently disagree with
 * what teams have already been billed.
 */
@Component({
  selector: 'app-subscription-plans',
  imports: [RouterLink, TranslatePipe, PageHeader],
  templateUrl: './subscription-plans.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPlans {
  private readonly api = inject(SubscriptionsApi);
  private readonly translation = inject(TranslationService);

  /**
   * Keyed on the locale as well: plan text is backend content served per
   * language, so switching language refetches rather than re-rendering stale
   * English blurbs.
   */
  private readonly resource = rxResource({
    params: () => ({ lang: this.translation.locale() }),
    stream: ({ params }) => this.api.plans(params.lang),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly plans = computed<MembershipPlan[]>(() => this.resource.value() ?? []);

  protected money(amount: number, currency: string): string {
    return new Intl.NumberFormat(this.translation.locale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected count(value: number): string {
    return new Intl.NumberFormat(this.translation.locale()).format(value);
  }
}
