import { PagedResult, ReconstructionRequest } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleRequests } from './requests.handler';

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

describe('requests handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores unrelated roots', () => {
    expect(handleRequests(makeContext(store, { path: 'work-requests' }))).toBeUndefined();
  });

  it('filters the list by status', () => {
    const body = expectHandled(
      handleRequests(makeContext(store, { path: 'requests', query: { status: 'new', pageSize: '50' } })),
    ).body as PagedResult<ReconstructionRequest>;
    expect(body.items.every((r) => r.status === 'new')).toBeTrue();
  });

  it('404s for an unknown request', () => {
    expect(expectHandled(handleRequests(makeContext(store, { path: 'requests/nope' }))).status).toBe(404);
  });

  describe('filing a damage report', () => {
    const body = {
      type: 'assessment',
      propertyType: 'residential',
      severity: 'severe',
      description: 'The upper floor collapsed and the stairwell is unsafe.',
      address: { governorate: 'khanYounis', district: 'Bani Suheila' },
      contactName: 'Layla Haddad',
      contactPhone: '+970590000111',
    };

    it('files the report under review, unmatched, at the top of the list', () => {
      const before = store.requests.length;
      const result = expectHandled(
        handleRequests(makeContext(store, { method: 'POST', path: 'requests/damage-report', body })),
      );

      expect(result.status).toBe(201);
      const request = result.body as ReconstructionRequest;
      // No team is chosen by the beneficiary — matching is an operator decision.
      expect(request.status).toBe('underReview');
      expect(request.assignedTeamId).toBeUndefined();
      expect(request.matchedTeams).toEqual([]);
      expect(request.severity).toBe('severe');
      expect(request.address.district).toBe('Bani Suheila');
      expect(store.requests.length).toBe(before + 1);
      expect(store.requests[0].id).toBe(request.id);
    });

    it('falls back to the profile contact when none is given', () => {
      const result = expectHandled(
        handleRequests(
          makeContext(store, {
            method: 'POST',
            path: 'requests/damage-report',
            body: { description: 'Partial damage to the roof.' },
          }),
        ),
      );

      const request = result.body as ReconstructionRequest;
      expect(request.contactPhone).toBe(store.beneficiaryProfile.phone);
      expect(request.contactName).toContain(store.beneficiaryProfile.firstName);
    });

    it('no longer accepts the removed duplicate POST /requests path', () => {
      expect(
        handleRequests(makeContext(store, { method: 'POST', path: 'requests', body })),
      ).toBeUndefined();
    });
  });
});
