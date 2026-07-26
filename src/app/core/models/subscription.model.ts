import { CurrencyCode, DisbursementMethod, SubscriptionStatus } from './domain.constants';

export const SUBSCRIPTION_PLANS = ['standard', 'premium'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

/**
 * What a membership tier costs and includes — port of the legacy
 * `priceList/plans-price-list`, which was that module's default screen and
 * showed one card per plan (name, blurb, price, billing period, feature list).
 *
 * `name`, `summary` and `features` are **backend content**, not UI chrome, so
 * they are held bilingually in the fixture and resolved from the request's
 * `lang` — the same contract as the damage-assessment questionnaire. A real
 * localized API would do exactly this; putting them in `ar.json`/`en.json`
 * would imply the frontend owns commercial terms it does not.
 */
export interface MembershipPlan {
  plan: SubscriptionPlan;
  name: string;
  summary: string;
  /** Annual membership fee. */
  fee: number;
  currency: CurrencyCode;
  /** What the fee buys, already in the caller's language. */
  features: string[];
  /** Teams currently holding an active membership on this tier. */
  activeTeams: number;
}

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
