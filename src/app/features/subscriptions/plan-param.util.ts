import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@core/models';

/**
 * Resolves a `?plan=` query param to a filter value.
 *
 * Anything not in `SUBSCRIPTION_PLANS` resolves to `''` (all plans) rather than
 * being passed through: a value the backend cannot match would filter every row
 * out, and an empty register reads as "this platform has no memberships" rather
 * than "that link was wrong".
 */
export function resolvePlanParam(param: string | undefined | null): SubscriptionPlan | '' {
  if (!param) {
    return '';
  }
  return (SUBSCRIPTION_PLANS as readonly string[]).includes(param)
    ? (param as SubscriptionPlan)
    : '';
}
