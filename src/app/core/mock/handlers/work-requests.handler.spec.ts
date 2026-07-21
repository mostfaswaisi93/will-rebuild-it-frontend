import { ReconstructionRequest } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { WorkRequestSummary } from '@core/api/dto/work-request.dto';
import { handleWorkRequests } from './work-requests.handler';

interface ListBody {
  items: ReconstructionRequest[];
  totalCount: number;
  summary: WorkRequestSummary;
}

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

describe('work-requests handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /work-requests', () => {
    expect(handleWorkRequests(makeContext(store, { path: 'requests' }))).toBeUndefined();
  });

  describe('GET /work-requests', () => {
    function list(query: Record<string, string> = {}): ListBody {
      return expectHandled(handleWorkRequests(makeContext(store, { path: 'work-requests', query })))
        .body as ListBody;
    }

    it('summarises the full unfiltered set', () => {
      const data = list();
      expect(data.summary.total).toBe(store.requests.length);
      expect(data.summary.unassigned).toBe(
        store.requests.filter((request) => !request.assignedTeamId).length,
      );
    });

    it('summarises the filtered set, not the whole store', () => {
      const data = list({ status: 'new' });
      const expected = store.requests.filter((request) => request.status === 'new').length;
      expect(data.totalCount).toBe(expected);
      expect(data.summary.total).toBe(expected);
      // Every seeded `new` request is unassigned, so the card must agree.
      expect(data.summary.unassigned).toBe(expected);
    });

    it('filters by governorate and severity together', () => {
      const data = list({ governorate: 'northGaza', severity: 'severe' });
      expect(
        data.items.every(
          (request) =>
            request.address.governorate === 'northGaza' && request.severity === 'severe',
        ),
      ).toBeTrue();
    });

    it('searches across number, description and contact name', () => {
      const data = list({ searchKey: 'grocery' });
      // REQ-2026-00161's description mentions a grocery.
      expect(data.items.some((request) => request.requestNumber === 'REQ-2026-00161')).toBeTrue();
    });

    it('returns newest first', () => {
      const items = list().items;
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1]!.createdAt >= items[i]!.createdAt).toBeTrue();
      }
    });

    it('paginates', () => {
      const firstPage = list({ pageNo: '1', pageSize: '3' });
      expect(firstPage.items.length).toBe(3);
      expect(firstPage.totalCount).toBe(store.requests.length);
    });
  });

  describe('POST /work-requests', () => {
    const VALID = {
      contactName: 'Rana Zaqout',
      contactPhone: '+970591000111',
      type: 'reconstruction',
      propertyType: 'residential',
      severity: 'severe',
      governorate: 'khanYounis',
      district: 'Al-Amal',
      streetDescription: 'Near the clinic',
      description: 'Collapsed rear wall and a cracked staircase; family of six still on site.',
    };

    it('creates a direct-booking request in the new state', () => {
      const before = store.requests.length;
      const result = expectHandled(
        handleWorkRequests(makeContext(store, { method: 'POST', path: 'work-requests', body: VALID })),
      );

      expect(result.status).toBe(201);
      const request = result.body as ReconstructionRequest;
      expect(request.status).toBe('new');
      expect(request.origin).toBe('directBooking');
      expect(request.assignedTeamId).toBeUndefined();
      expect(store.requests.length).toBe(before + 1);
      // Prepended, so it leads the newest-first list.
      expect(store.requests[0]!.id).toBe(request.id);
    });

    it('continues the seeded request numbering', () => {
      const result = expectHandled(
        handleWorkRequests(makeContext(store, { method: 'POST', path: 'work-requests', body: VALID })),
      );
      // Highest seeded number is REQ-2026-00165.
      expect((result.body as ReconstructionRequest).requestNumber).toBe('REQ-2026-00166');
    });

    it('rejects a submission missing contact or description', () => {
      const result = expectHandled(
        handleWorkRequests(
          makeContext(store, {
            method: 'POST',
            path: 'work-requests',
            body: { contactName: 'X', contactPhone: '+970591000111' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('is findable afterwards and filtered by its origin', () => {
      const created = expectHandled(
        handleWorkRequests(makeContext(store, { method: 'POST', path: 'work-requests', body: VALID })),
      ).body as ReconstructionRequest;

      const directOnly = expectHandled(
        handleWorkRequests(
          makeContext(store, { path: 'work-requests', query: { origin: 'directBooking' } }),
        ),
      ).body as ListBody;

      expect(directOnly.items.every((request) => request.origin === 'directBooking')).toBeTrue();
      expect(directOnly.items.some((request) => request.id === created.id)).toBeTrue();
    });

    it('treats requests with no origin as beneficiary-portal', () => {
      // The seeded rows carry no `origin`, so the portal filter must include them.
      const portalOnly = expectHandled(
        handleWorkRequests(
          makeContext(store, { path: 'work-requests', query: { origin: 'beneficiaryPortal' } }),
        ),
      ).body as ListBody;
      expect(portalOnly.totalCount).toBe(store.requests.filter((r) => !r.origin).length);
    });
  });

  describe('POST /work-requests/:id/assign', () => {
    it('assigns a team and moves the request to matched', () => {
      const target = store.requests.find((request) => !request.assignedTeamId);
      const team = store.teams[0];
      expect(target).toBeDefined();
      expect(team).toBeDefined();

      const result = expectHandled(
        handleWorkRequests(
          makeContext(store, {
            method: 'POST',
            path: `work-requests/${target!.id}/assign`,
            body: { teamId: team!.id },
          }),
        ),
      );

      expect(result.status).toBe(200);
      const updated = result.body as ReconstructionRequest;
      expect(updated.status).toBe('matched');
      expect(updated.assignedTeamId).toBe(team!.id);
      expect(updated.matchedTeams.some((t) => t.teamId === team!.id && t.status === 'assigned')).toBeTrue();
    });

    it('rejects an unknown team', () => {
      const target = store.requests.find((request) => !request.assignedTeamId);
      const result = expectHandled(
        handleWorkRequests(
          makeContext(store, {
            method: 'POST',
            path: `work-requests/${target!.id}/assign`,
            body: { teamId: 'team-does-not-exist' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('promotes an already-suggested team rather than duplicating it', () => {
      // request-9 suggests team-2 and team-4.
      const target = store.requests.find((request) => request.id === 'request-9')!;
      const before = target.matchedTeams.length;

      const result = expectHandled(
        handleWorkRequests(
          makeContext(store, {
            method: 'POST',
            path: 'work-requests/request-9/assign',
            body: { teamId: 'team-2' },
          }),
        ),
      );

      const updated = result.body as ReconstructionRequest;
      expect(updated.matchedTeams.length).toBe(before);
      expect(updated.matchedTeams.find((t) => t.teamId === 'team-2')?.status).toBe('assigned');
    });
  });

  describe('POST /work-requests/:id/reject', () => {
    it('moves the request to rejected', () => {
      const target = store.requests[0]!;
      const result = expectHandled(
        handleWorkRequests(
          makeContext(store, { method: 'POST', path: `work-requests/${target.id}/reject` }),
        ),
      );
      expect((result.body as ReconstructionRequest).status).toBe('rejected');
    });

    it('404s for an unknown request', () => {
      const result = expectHandled(
        handleWorkRequests(makeContext(store, { method: 'POST', path: 'work-requests/nope/reject' })),
      );
      expect(result.status).toBe(404);
    });
  });
});
