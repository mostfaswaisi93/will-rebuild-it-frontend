import { SUBSCRIPTION_PLANS } from '@core/models';
import { resolvePlanParam } from './plan-param.util';

describe('resolvePlanParam', () => {
  it('accepts every declared plan', () => {
    for (const plan of SUBSCRIPTION_PLANS) {
      expect(resolvePlanParam(plan)).toBe(plan);
    }
  });

  it('falls back to all plans for an absent param', () => {
    expect(resolvePlanParam(undefined)).toBe('');
    expect(resolvePlanParam(null)).toBe('');
    expect(resolvePlanParam('')).toBe('');
  });

  /**
   * The guard that matters: passing an unknown value straight through would
   * filter every row out, and the operator would read an empty register as
   * "no memberships exist" rather than "that link was wrong".
   */
  it('falls back to all plans for a value no membership can hold', () => {
    expect(resolvePlanParam('gold')).toBe('');
    expect(resolvePlanParam('STANDARD')).toBe('');
    expect(resolvePlanParam('standard ')).toBe('');
  });

  it('does not resolve inherited Object properties', () => {
    // `includes` on the union array is an own-value check, but a naive
    // `PLANS[param]`-style lookup would resolve these to functions.
    expect(resolvePlanParam('toString')).toBe('');
    expect(resolvePlanParam('constructor')).toBe('');
  });
});
