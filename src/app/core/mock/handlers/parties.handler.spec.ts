import { Beneficiary, PagedResult, ReconstructionRequest, Supplier } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleBeneficiaries } from './beneficiaries.handler';
import { handleSuppliers } from './suppliers.handler';

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

describe('beneficiaries handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /beneficiaries', () => {
    expect(handleBeneficiaries(makeContext(store, { path: 'suppliers' }))).toBeUndefined();
  });

  it('filters by status and governorate', () => {
    const body = expectHandled(
      handleBeneficiaries(
        makeContext(store, { path: 'beneficiaries', query: { status: 'verified', pageSize: '50' } }),
      ),
    ).body as PagedResult<Beneficiary>;
    expect(body.items.every((b) => b.status === 'verified')).toBeTrue();
  });

  it('gathers a case file with the household requests matched by phone', () => {
    // ben-1's phone matches request-1's contactPhone.
    const result = expectHandled(
      handleBeneficiaries(makeContext(store, { path: 'beneficiaries/ben-1' })),
    );
    const body = result.body as { beneficiary: Beneficiary; requests: ReconstructionRequest[] };
    expect(body.beneficiary.id).toBe('ben-1');
    expect(body.requests.every((r) => r.contactPhone === body.beneficiary.phone)).toBeTrue();
    expect(body.requests.length).toBeGreaterThan(0);
  });

  it('records an eligibility decision', () => {
    const result = expectHandled(
      handleBeneficiaries(
        makeContext(store, { method: 'POST', path: 'beneficiaries/ben-3/status', body: { status: 'verified' } }),
      ),
    );
    expect((result.body as Beneficiary).status).toBe('verified');
  });

  it('rejects an invalid status', () => {
    const result = expectHandled(
      handleBeneficiaries(
        makeContext(store, { method: 'POST', path: 'beneficiaries/ben-3/status', body: { status: 'banana' } }),
      ),
    );
    expect(result.status).toBe(400);
  });
});

describe('suppliers handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('filters by material category', () => {
    const body = expectHandled(
      handleSuppliers(makeContext(store, { path: 'suppliers', query: { category: 'steel', pageSize: '50' } })),
    ).body as PagedResult<Supplier>;
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((s) => s.categories.includes('steel'))).toBeTrue();
  });

  it('approves a pending supplier', () => {
    const pending = store.suppliers.find((s) => s.status === 'pending')!;
    const result = expectHandled(
      handleSuppliers(
        makeContext(store, { method: 'POST', path: `suppliers/${pending.id}/status`, body: { status: 'approved' } }),
      ),
    );
    expect((result.body as Supplier).status).toBe('approved');
  });

  it('404s for an unknown supplier', () => {
    const result = expectHandled(
      handleSuppliers(makeContext(store, { method: 'POST', path: 'suppliers/nope/status', body: { status: 'approved' } })),
    );
    expect(result.status).toBe(404);
  });
});
