import { Statement } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { StatementSummary } from '@core/api/statements-api.service';
import { handleStatements } from './statements.handler';

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

describe('statements handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /statements', () => {
    expect(handleStatements(makeContext(store, { path: 'estimates' }))).toBeUndefined();
  });

  describe('GET /statements', () => {
    it('summarises awaiting-review and paid totals', () => {
      const body = expectHandled(handleStatements(makeContext(store, { path: 'statements' }))).body as {
        summary: StatementSummary;
      };
      const awaiting = store.statements.filter(
        (s) => s.status === 'submitted' || s.status === 'underReview',
      ).length;
      expect(body.summary.awaitingReview).toBe(awaiting);
      expect(body.summary.paidAmount).toBe(
        store.statements.reduce((sum, s) => sum + s.paidAmount, 0),
      );
    });
  });

  describe('approve', () => {
    it('approves for the full net by default and stamps review', () => {
      const submitted = store.statements.find((s) => s.status === 'submitted')!;
      const result = expectHandled(
        handleStatements(makeContext(store, { method: 'POST', path: `statements/${submitted.id}/approve`, body: {} })),
      );
      const updated = result.body as Statement;
      expect(updated.status).toBe('approved');
      expect(updated.approvedAmount).toBe(updated.netAmount);
      expect(updated.reviewedAt).toBeTruthy();
    });

    it('accepts a reduced approved amount', () => {
      const submitted = store.statements.find((s) => s.status === 'submitted')!;
      const result = expectHandled(
        handleStatements(
          makeContext(store, {
            method: 'POST',
            path: `statements/${submitted.id}/approve`,
            body: { approvedAmount: 100 },
          }),
        ),
      );
      expect((result.body as Statement).approvedAmount).toBe(100);
    });

    it('rejects an approved amount above the net claimed', () => {
      const submitted = store.statements.find((s) => s.status === 'submitted')!;
      const result = expectHandled(
        handleStatements(
          makeContext(store, {
            method: 'POST',
            path: `statements/${submitted.id}/approve`,
            body: { approvedAmount: submitted.netAmount + 1 },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('refuses to approve a statement that is already paid', () => {
      const paid = store.statements.find((s) => s.status === 'paid')!;
      const result = expectHandled(
        handleStatements(makeContext(store, { method: 'POST', path: `statements/${paid.id}/approve`, body: {} })),
      );
      expect(result.status).toBe(400);
    });
  });

  describe('reject', () => {
    it('records the reason', () => {
      const submitted = store.statements.find((s) => s.status === 'submitted')!;
      const result = expectHandled(
        handleStatements(
          makeContext(store, {
            method: 'POST',
            path: `statements/${submitted.id}/reject`,
            body: { rejectionReason: 'Quantities exceed the site log.' },
          }),
        ),
      );
      expect((result.body as Statement).status).toBe('rejected');
    });

    it('requires a reason', () => {
      const submitted = store.statements.find((s) => s.status === 'submitted')!;
      const result = expectHandled(
        handleStatements(makeContext(store, { method: 'POST', path: `statements/${submitted.id}/reject`, body: {} })),
      );
      expect(result.status).toBe(400);
    });
  });

  describe('pay', () => {
    function approve(id: string): void {
      handleStatements(makeContext(store, { method: 'POST', path: `statements/${id}/approve`, body: {} }));
    }

    it('marks partiallyPaid then paid across two payments', () => {
      const target = store.statements.find((s) => s.status === 'submitted')!;
      approve(target.id);
      const net = target.netAmount;

      const first = expectHandled(
        handleStatements(makeContext(store, { method: 'POST', path: `statements/${target.id}/pay`, body: { amount: net - 100 } })),
      ).body as Statement;
      expect(first.status).toBe('partiallyPaid');

      const second = expectHandled(
        handleStatements(makeContext(store, { method: 'POST', path: `statements/${target.id}/pay`, body: { amount: 100 } })),
      ).body as Statement;
      expect(second.status).toBe('paid');
      expect(second.paidAmount).toBe(net);
    });

    it('rejects a payment above the outstanding balance', () => {
      const target = store.statements.find((s) => s.status === 'submitted')!;
      approve(target.id);
      const result = expectHandled(
        handleStatements(
          makeContext(store, {
            method: 'POST',
            path: `statements/${target.id}/pay`,
            body: { amount: target.netAmount + 1 },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('refuses to pay a statement that is not approved', () => {
      const submitted = store.statements.find((s) => s.status === 'submitted')!;
      const result = expectHandled(
        handleStatements(makeContext(store, { method: 'POST', path: `statements/${submitted.id}/pay`, body: { amount: 10 } })),
      );
      expect(result.status).toBe(400);
    });
  });
});
