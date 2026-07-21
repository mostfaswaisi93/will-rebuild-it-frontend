import { Estimate } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleEstimates } from './estimates.handler';

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

describe('estimates handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /estimates', () => {
    expect(handleEstimates(makeContext(store, { path: 'projects' }))).toBeUndefined();
  });

  describe('GET /estimates', () => {
    it('filters by status', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { path: 'estimates', query: { status: 'pendingApproval' } })),
      );
      const items = (result.body as { items: Estimate[] }).items;
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((estimate) => estimate.status === 'pendingApproval')).toBeTrue();
    });

    it('searches number and project title', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { path: 'estimates', query: { searchKey: 'roof' } })),
      );
      const items = (result.body as { items: Estimate[] }).items;
      // Estimate 4 is the roof replacement.
      expect(items.some((estimate) => estimate.estimateNumber === 'EST-2026-00104')).toBeTrue();
    });
  });

  describe('POST /estimates/:id/approve', () => {
    it('approves, stamps the date, and stores the signature', () => {
      const pending = store.estimates.find((estimate) => estimate.status === 'pendingApproval')!;
      const result = expectHandled(
        handleEstimates(
          makeContext(store, {
            method: 'POST',
            path: `estimates/${pending.id}/approve`,
            body: { signatureImage: 'data:image/png;base64,AAAA' },
          }),
        ),
      );

      const updated = result.body as Estimate;
      expect(updated.status).toBe('approved');
      expect(updated.approvedAt).toBeTruthy();
      // The whole point of capturing a signature is that it is kept.
      expect(updated.approvalSignatureUrl).toBe('data:image/png;base64,AAAA');
    });

    it('clears any prior rejection reason on re-approval', () => {
      const rejected = store.estimates.find((estimate) => estimate.status === 'rejected')!;
      expect(rejected.rejectionReason).toBeTruthy();

      const result = expectHandled(
        handleEstimates(
          makeContext(store, {
            method: 'POST',
            path: `estimates/${rejected.id}/approve`,
            body: { signatureImage: 'data:image/png;base64,BBBB' },
          }),
        ),
      );
      expect((result.body as Estimate).rejectionReason).toBeUndefined();
    });

    it('404s for an unknown estimate', () => {
      const result = expectHandled(
        handleEstimates(makeContext(store, { method: 'POST', path: 'estimates/nope/approve' })),
      );
      expect(result.status).toBe(404);
    });
  });

  describe('POST /estimates/:id/reject', () => {
    it('rejects and records the reason', () => {
      const pending = store.estimates.find((estimate) => estimate.status === 'pendingApproval')!;
      const result = expectHandled(
        handleEstimates(
          makeContext(store, {
            method: 'POST',
            path: `estimates/${pending.id}/reject`,
            body: { rejectionReason: 'Rates above the approved schedule.' },
          }),
        ),
      );
      const updated = result.body as Estimate;
      expect(updated.status).toBe('rejected');
      expect(updated.rejectionReason).toBe('Rates above the approved schedule.');
    });
  });
});
