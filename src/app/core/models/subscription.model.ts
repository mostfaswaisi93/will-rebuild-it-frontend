import { CurrencyCode, DisbursementMethod, SubscriptionStatus } from './domain.constants';

export const SUBSCRIPTION_PLANS = ['standard', 'premium'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

/** One membership-fee payment against a subscription. */
export interface SubscriptionPayment {
  id: string;
  amount: number;
  currency: CurrencyCode;
  paidAt: string;
  method: DisbursementMethod;
  /** `refunded` when a payment was reversed (the legacy leadgen refund flow). */
  refunded: boolean;
}

/**
 * A contracting team's platform membership — the reconstruction reframe of the
 * legacy Vanlynk/Leadgen subscriptions. Rather than paying for marketing leads,
 * a firm pays an annual membership to stay verified and eligible for tenders.
 *
 * The legacy portal split this across 16 near-duplicate routes (Vanlynk vs
 * Leadgen × subscription/payment/refund history). Those product lines collapse
 * to one concept here: one subscription per team, with its payment history and
 * refunds inline.
 */
export interface Subscription {
  id: string;
  subscriptionNumber: string;
  teamId: string;
  teamName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  /** Annual membership fee. */
  amount: number;
  currency: CurrencyCode;
  startedAt: string;
  /** Next renewal due date. */
  renewsAt: string;
  payments: SubscriptionPayment[];
}
