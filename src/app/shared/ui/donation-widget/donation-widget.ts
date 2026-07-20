import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { LucideHeart } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Presentational donation invitation card for public project pages.
 *
 * NOTE FOR WHOEVER WIRES UP PAYMENTS LATER: this component is intentionally
 * presentational only — there is no Stripe (or any other payment provider)
 * integration here. It just collects an amount/frequency and emits
 * `donate()`; the consuming page is responsible for navigating to the real
 * donate/checkout flow.
 */
@Component({
  selector: 'app-donation-widget',
  imports: [LucideHeart, TranslatePipe],
  templateUrl: './donation-widget.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonationWidget {
  /** Optional — when absent, the widget implies donating to the general fund. */
  readonly projectTitle = input<string>();
  readonly suggestedAmounts = input<number[]>([25, 50, 100, 250]);

  readonly amount = model<number | null>(null);
  readonly frequency = model<'once' | 'monthly'>('once');

  /** Parent (a future public project page) navigates to the donate route on this. */
  readonly donate = output<void>();

  protected readonly isDonateDisabled = computed(() => {
    const amount = this.amount();
    return amount === null || amount <= 0;
  });

  protected selectAmount(value: number): void {
    this.amount.set(value);
  }

  protected onCustomAmountInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;

    if (raw === '') {
      this.amount.set(null);
      return;
    }

    const parsed = Number(raw);
    this.amount.set(Number.isFinite(parsed) ? parsed : null);
  }

  protected selectFrequency(value: 'once' | 'monthly'): void {
    this.frequency.set(value);
  }

  protected onDonateClick(): void {
    if (this.isDonateDisabled()) {
      return;
    }
    this.donate.emit();
  }
}
