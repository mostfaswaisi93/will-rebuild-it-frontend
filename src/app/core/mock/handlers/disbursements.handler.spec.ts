import { PagedResult, Payout } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { DisbursementSummary } from '@core/api/disbursements-api.service';
import { handleDisbursements } from './disbursements.handler';

function makeContext(
  store: MockStore,
  { method = 'GET', path, query = {}, body = null }: {
    method?: string;
    path: string;
    query?: Record<string, string>;
    body?: unknown;
  },
): MockRequestContext {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return { method, path, segments, query: new URLSearchParams(query), body, store };
}

function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler did not claim the route').toBeDefined();
  return result as MockResult;
}

describe('disbursements handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /disbursements', () => {
    expect(handleDisbursements(makeContext(store, { path: 'statements' }))).toBeUndefined();
  });

  describe('GET /disbursements', () => {
    it('summarises in-flight and settled totals', () => {
      const body = expectHandled(handleDisbursements(makeContext(store, { path: 'disbursements' })))
        .body as PagedResult<Payout> & { summary: DisbursementSummary };
      const inFlight = store.payouts.filter((p) =>
        ['pending', 'authorised', 'sent'].includes(p.status),
      );
      expect(body.summary.inFlightCount).toBe(inFlight.length);
      expect(body.summary.settledAmount).toBe(
        store.payouts.filter((p) => p.status === 'settled').reduce((s, p) => s + p.amount, 0),
      );
    });

    it('filters by method', () => {
      const body = expectHandled(
        handleDisbursements(makeContext(store, { path: 'disbursements', query: { method: 'cheque' } })),
      ).body as PagedResult<Payout>;
      expect(body.items.every((p) => p.method === 'cheque')).toBeTrue();
    });
  });

  describe('POST /disbursements/:id/transition', () => {
    it('advances pending → authorised', () => {
      const pending = store.payouts.find((p) => p.status === 'pending')!;
      const result = expectHandled(
        handleDisbursements(
          makeContext(store, {
            method: 'POST',
            path: `disbursements/${pending.id}/transition`,
            body: { status: 'authorised' },
          }),
        ),
      );
      expect((result.body as Payout).status).toBe('authorised');
    });

    it('stamps settledAt when settled', () => {
      // pay-2 is sent → settled.
      const result = expectHandled(
        handleDisbursements(
          makeContext(store, {
            method: 'POST',
            path: 'disbursements/pay-2/transition',
            body: { status: 'settled' },
          }),
        ),
      );
      const updated = result.body as Payout;
      expect(updated.status).toBe('settled');
      expect(updated.settledAt).toBeTruthy();
    });

    it('captures a reference when marking sent', () => {
      const result = expectHandled(
        handleDisbursements(
          makeContext(store, {
            method: 'POST',
            path: 'disbursements/pay-3/transition',
            body: { status: 'sent', reference: 'WALLET-777' },
          }),
        ),
      );
      expect((result.body as Payout).reference).toBe('WALLET-777');
    });

    it('rejects an illegal jump (pending → settled)', () => {
      const pending = store.payouts.find((p) => p.status === 'pending')!;
      const result = expectHandled(
        handleDisbursements(
          makeContext(store, {
            method: 'POST',
            path: `disbursements/${pending.id}/transition`,
            body: { status: 'settled' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('refuses to move a settled payout', () => {
      const settled = store.payouts.find((p) => p.status === 'settled')!;
      const result = expectHandled(
        handleDisbursements(
          makeContext(store, {
            method: 'POST',
            path: `disbursements/${settled.id}/transition`,
            body: { status: 'failed' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });
  });
});
