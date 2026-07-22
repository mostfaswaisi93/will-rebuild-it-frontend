import { PagedResult, StaffMember } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleStaff } from './staff.handler';

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

describe('staff handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores unrelated roots', () => {
    expect(handleStaff(makeContext(store, { path: 'teams' }))).toBeUndefined();
  });

  it('filters by status and team', () => {
    const body = expectHandled(
      handleStaff(makeContext(store, { path: 'staff', query: { status: 'active', pageSize: '50' } })),
    ).body as PagedResult<StaffMember>;
    expect(body.items.every((s) => s.status === 'active')).toBeTrue();
  });

  it('returns a member with their timecard', () => {
    const result = expectHandled(handleStaff(makeContext(store, { path: 'staff/staff-1' })));
    const member = result.body as StaffMember;
    expect(member.id).toBe('staff-1');
    expect(member.timecard.length).toBeGreaterThan(0);
  });

  it('updates status', () => {
    const result = expectHandled(
      handleStaff(makeContext(store, { method: 'POST', path: 'staff/staff-1/status', body: { status: 'onLeave' } })),
    );
    expect((result.body as StaffMember).status).toBe('onLeave');
  });

  it('rejects an invalid status', () => {
    const result = expectHandled(
      handleStaff(makeContext(store, { method: 'POST', path: 'staff/staff-1/status', body: { status: 'x' } })),
    );
    expect(result.status).toBe(400);
  });

  it('404s for an unknown member', () => {
    expect(expectHandled(handleStaff(makeContext(store, { path: 'staff/nope' }))).status).toBe(404);
  });
});
