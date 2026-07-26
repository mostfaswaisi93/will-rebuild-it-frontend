import { Subscription } from '@core/models';
import { SubscriptionPage, SubscriptionSummary } from '@core/api/subscriptions-api.service';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleSubscriptions } from './subscriptions.handler';

function makeContext(
  store: MockStore,
  { method = 'GET', path, query = {}, body = null }: {
    method?: string;
    path: string;
    query?: Record<string, string>;
    body?: unknown;
  },
): MockRequestContext {
  const segments = path.split('/').filter((s) => s.length > 0);
  return { method, path, segments, query: new URLSearchParams(query), body, store };
}

function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler did not claim the route').toBeDefined();
  return result as MockResult;
}

describe('subscriptions handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores unrelated roots', () => {
    expect(handleSubscriptions(makeContext(store, { path: 'campaigns' }))).toBeUndefined();
  });

  it('summarises active count and annual revenue', () => {
    const page = expectHandled(
      handleSubscriptions(makeContext(store, { path: 'subscriptions', query: { pageSize: '50' } })),
    ).body as SubscriptionPage;
    const summary: SubscriptionSummary = page.summary;
    const active = store.subscriptions.filter((s) => s.status === 'active');
    expect(summary.activeCount).toBe(active.length);
    expect(summary.annualRevenue).toBe(active.reduce((sum, s) => sum + s.amount, 0));
    expect(summary.pastDueCount).toBe(store.subscriptions.filter((s) => s.status === 'pastDue').length);
  });

  it('filters by status and plan', () => {
    const page = expectHandled(
      handleSubscriptions(
        makeContext(store, { path: 'subscriptions', query: { status: 'active', plan: 'premium', pageSize: '50' } }),
      ),
    ).body as SubscriptionPage;
    expect(page.items.every((s) => s.status === 'active' && s.plan === 'premium')).toBeTrue();
  });

  it('returns a subscription with its payment history', () => {
    const sub = expectHandled(handleSubscriptions(makeContext(store, { path: 'subscriptions/sub-1' })))
      .body as Subscription;
    expect(sub.id).toBe('sub-1');
    expect(sub.payments.length).toBeGreaterThan(0);
  });

  it('renews: records a payment, extends a year, and reactivates', () => {
    const before = store.subscriptions.find((s) => s.id === 'sub-3')!;
    const priorPayments = before.payments.length;
    const priorRenewsAt = before.renewsAt;
    const sub = expectHandled(
      handleSubscriptions(makeContext(store, { method: 'POST', path: 'subscriptions/sub-3/renew' })),
    ).body as Subscription;
    expect(sub.status).toBe('active');
    expect(sub.payments.length).toBe(priorPayments + 1);
    expect(new Date(sub.renewsAt).getTime()).toBeGreaterThan(new Date(priorRenewsAt).getTime());
  });

  it('refuses to renew a cancelled subscription', () => {
    expect(
      expectHandled(
        handleSubscriptions(makeContext(store, { method: 'POST', path: 'subscriptions/sub-5/renew' })),
      ).status,
    ).toBe(400);
  });

  it('cancels an active subscription', () => {
    const sub = expectHandled(
      handleSubscriptions(makeContext(store, { method: 'POST', path: 'subscriptions/sub-1/cancel' })),
    ).body as Subscription;
    expect(sub.status).toBe('cancelled');
  });

  it('refunds a payment once, then rejects a second refund', () => {
    const first = expectHandled(
      handleSubscriptions(
        makeContext(store, { method: 'POST', path: 'subscriptions/sub-2/payments/sp-2-1/refund' }),
      ),
    ).body as Subscription;
    expect(first.payments.find((p) => p.id === 'sp-2-1')?.refunded).toBeTrue();

    const second = expectHandled(
      handleSubscriptions(
        makeContext(store, { method: 'POST', path: 'subscriptions/sub-2/payments/sp-2-1/refund' }),
      ),
    );
    expect(second.status).toBe(400);
  });

  it('404s for an unknown subscription', () => {
    expect(expectHandled(handleSubscriptions(makeContext(store, { path: 'subscriptions/nope' }))).status).toBe(404);
  });

  /**
   * `GET /subscriptions/plans` and `GET /subscriptions/:id` both match two
   * segments, so the plans branch only works while it sits above the `:id` one.
   * Move it below and "plans" is read as a subscription id — a 404 on a route
   * that looks correct in the router. These pin the order.
   */
  describe('GET /subscriptions/plans', () => {
    it('serves the catalogue rather than being read as an id', () => {
      const result = expectHandled(
        handleSubscriptions(makeContext(store, { path: 'subscriptions/plans' })),
      );

      expect(result.status).toBe(200);
      const plans = result.body as { plan: string; fee: number; features: string[] }[];
      expect(plans.map((p) => p.plan)).toEqual(['standard', 'premium']);
      expect(plans.every((p) => p.features.length > 0)).toBeTrue();
    });

    it('quotes the same fee the seeded memberships are billed', () => {
      const plans = expectHandled(
        handleSubscriptions(makeContext(store, { path: 'subscriptions/plans' })),
      ).body as { plan: string; fee: number }[];

      for (const plan of plans) {
        const billed = store.subscriptions.filter((sub) => sub.plan === plan.plan);
        for (const sub of billed) {
          expect(sub.amount)
            .withContext(`${sub.subscriptionNumber} is billed ${sub.amount} but ${plan.plan} quotes ${plan.fee}`)
            .toBe(plan.fee);
        }
      }
    });

    it('counts only active memberships per tier', () => {
      const plans = expectHandled(
        handleSubscriptions(makeContext(store, { path: 'subscriptions/plans' })),
      ).body as { plan: string; activeTeams: number }[];

      for (const plan of plans) {
        const expected = store.subscriptions.filter(
          (sub) => sub.plan === plan.plan && sub.status === 'active',
        ).length;
        expect(plan.activeTeams).toBe(expected);
      }
    });

    it('serves plan copy in the requested locale', () => {
      const en = expectHandled(
        handleSubscriptions(makeContext(store, { path: 'subscriptions/plans', query: { lang: 'en' } })),
      ).body as { name: string }[];
      const ar = expectHandled(
        handleSubscriptions(makeContext(store, { path: 'subscriptions/plans', query: { lang: 'ar' } })),
      ).body as { name: string }[];

      expect(ar.length).toBe(en.length);
      expect(ar[0].name).not.toBe(en[0].name);
      expect(ar[0].name).toMatch(/[؀-ۿ]/);
    });
  });
});
