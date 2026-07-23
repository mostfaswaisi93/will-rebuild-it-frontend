import { Complaint, PagedResult } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleComplaints } from './complaints.handler';

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

describe('complaints handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores unrelated roots', () => {
    expect(handleComplaints(makeContext(store, { path: 'support' }))).toBeUndefined();
  });

  it('filters the list by status', () => {
    const body = expectHandled(
      handleComplaints(makeContext(store, { path: 'complaints', query: { status: 'open', pageSize: '50' } })),
    ).body as PagedResult<Complaint>;
    expect(body.items.every((c) => c.status === 'open')).toBeTrue();
  });

  it('files a complaint as open and puts it at the top', () => {
    const before = store.complaints.length;
    const result = expectHandled(
      handleComplaints(
        makeContext(store, {
          method: 'POST',
          path: 'complaints',
          body: {
            teamId: store.teams[0].id,
            description: 'Work stalled for three weeks.',
            reasons: { delay: true },
          },
        }),
      ),
    );

    expect(result.status).toBe(201);
    const complaint = result.body as Complaint;
    expect(complaint.status).toBe('open');
    expect(complaint.reasons.delay).toBeTrue();
    expect(store.complaints.length).toBe(before + 1);
    expect(store.complaints[0].id).toBe(complaint.id);
  });

  describe('operator response', () => {
    function openComplaint(): Complaint {
      const complaint = store.complaints.find((c) => c.status === 'open');
      expect(complaint).withContext('fixture needs an open complaint').toBeDefined();
      return complaint!;
    }

    it('records the response and closes the complaint', () => {
      const target = openComplaint();
      const result = expectHandled(
        handleComplaints(
          makeContext(store, {
            method: 'POST',
            path: `complaints/${target.id}/respond`,
            body: { responseBody: 'We have reassigned the crew and work resumes Sunday.' },
          }),
        ),
      );

      const updated = result.body as Complaint;
      expect(updated.status).toBe('closed');
      expect(updated.responseBody).toContain('reassigned');
    });

    it('refuses to answer an already-closed complaint', () => {
      const target = openComplaint();
      handleComplaints(
        makeContext(store, {
          method: 'POST',
          path: `complaints/${target.id}/respond`,
          body: { responseBody: 'First reply, long enough.' },
        }),
      );

      const second = expectHandled(
        handleComplaints(
          makeContext(store, {
            method: 'POST',
            path: `complaints/${target.id}/respond`,
            body: { responseBody: 'Second reply, also long enough.' },
          }),
        ),
      );

      expect(second.status).toBe(400);
    });

    it('rejects an empty response', () => {
      const target = openComplaint();
      expect(
        expectHandled(
          handleComplaints(
            makeContext(store, {
              method: 'POST',
              path: `complaints/${target.id}/respond`,
              body: { responseBody: '   ' },
            }),
          ),
        ).status,
      ).toBe(400);
    });

    it('404s for an unknown complaint', () => {
      expect(
        expectHandled(
          handleComplaints(
            makeContext(store, { method: 'POST', path: 'complaints/nope/respond', body: { responseBody: 'Hello there.' } }),
          ),
        ).status,
      ).toBe(404);
    });
  });
});
