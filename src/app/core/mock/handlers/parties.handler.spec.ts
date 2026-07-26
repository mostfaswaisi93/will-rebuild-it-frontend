import { Beneficiary, PagedResult, ReconstructionRequest, Supplier, Team } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleBeneficiaries } from './beneficiaries.handler';
import { handleSuppliers } from './suppliers.handler';
import { handleTeams } from './teams.handler';

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

describe('teams handler — firm standing', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  const setStatus = (id: string, body: unknown) =>
    handleTeams(makeContext(store, { method: 'POST', path: `teams/${id}/status`, body }));

  /**
   * The reason is enforced on the server, not merely required by the form.
   * Suspension stops a firm bidding and hides it from the families choosing who
   * rebuilds their home, so the record has to carry why.
   */
  it('refuses to suspend without a reason', () => {
    expect(expectHandled(setStatus('team-1', { status: 'suspended' })).status).toBe(400);
    expect(expectHandled(setStatus('team-1', { status: 'suspended', note: '   ' })).status).toBe(400);
    expect(store.teams.find((t) => t.id === 'team-1')?.status).toBe('active');
  });

  it('suspends with a reason and records it', () => {
    const result = expectHandled(
      setStatus('team-1', { status: 'suspended', note: '  Licence expired 30 June  ' }),
    );

    expect(result.status).toBe(200);
    const team = result.body as Team;
    expect(team.status).toBe('suspended');
    expect(team.statusNote).toBe('Licence expired 30 June');
    expect(team.statusChangedAt).toBeTruthy();
  });

  it('reinstates without a reason and clears the old note', () => {
    expectHandled(setStatus('team-4', { status: 'active' }));

    const team = store.teams.find((t) => t.id === 'team-4');
    expect(team?.status).toBe('active');
    expect(team?.statusNote).toBeUndefined();
  });

  it('rejects a status no firm can hold', () => {
    expect(expectHandled(setStatus('team-1', { status: 'probation', note: 'x'.repeat(20) })).status).toBe(400);
    expect(expectHandled(setStatus('team-1', {})).status).toBe(400);
  });

  it('404s for an unknown firm', () => {
    expect(expectHandled(setStatus('nope', { status: 'active' })).status).toBe(404);
  });

  /**
   * The filter is opt-in: the operator register must keep showing a suspended
   * firm (that is where it gets reinstated) while the beneficiary browse asks
   * for active only. A default filter would hide it from both.
   */
  it('lists every firm unless a status is asked for', () => {
    const all = expectHandled(handleTeams(makeContext(store, { path: 'teams', query: { pageSize: '50' } })))
      .body as PagedResult<Team>;
    const activeOnly = expectHandled(
      handleTeams(makeContext(store, { path: 'teams', query: { pageSize: '50', status: 'active' } })),
    ).body as PagedResult<Team>;

    expect(all.items.some((t) => t.status === 'suspended')).toBeTrue();
    expect(activeOnly.items.length).toBeLessThan(all.items.length);
    expect(activeOnly.items.every((t) => t.status === 'active')).toBeTrue();
  });
});
