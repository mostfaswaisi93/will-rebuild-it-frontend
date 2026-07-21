import { Inspection, WorkOrder } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleWorkOrders } from './work-orders.handler';

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

describe('work-orders handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /work-orders', () => {
    expect(handleWorkOrders(makeContext(store, { path: 'projects' }))).toBeUndefined();
  });

  describe('GET /work-orders', () => {
    it('summarises and filters by status', () => {
      const result = expectHandled(
        handleWorkOrders(makeContext(store, { path: 'work-orders', query: { status: 'scheduled' } })),
      );
      const body = result.body as { items: WorkOrder[]; summary: { scheduled: number } };
      expect(body.items.every((wo) => wo.status === 'scheduled')).toBeTrue();
    });

    it('counts completed and inspected together in the summary', () => {
      const body = expectHandled(handleWorkOrders(makeContext(store, { path: 'work-orders' })))
        .body as { summary: { completed: number } };
      const expected = store.workOrders.filter(
        (wo) => wo.status === 'completed' || wo.status === 'inspected',
      ).length;
      expect(body.summary.completed).toBe(expected);
    });
  });

  describe('POST /work-orders/:id/transition', () => {
    it('applies a valid transition', () => {
      // wo-3 is scheduled → dispatched is allowed.
      const result = expectHandled(
        handleWorkOrders(
          makeContext(store, {
            method: 'POST',
            path: 'work-orders/wo-3/transition',
            body: { status: 'dispatched' },
          }),
        ),
      );
      expect((result.body as WorkOrder).status).toBe('dispatched');
    });

    it('rejects an invalid transition', () => {
      // scheduled → completed is not allowed.
      const result = expectHandled(
        handleWorkOrders(
          makeContext(store, {
            method: 'POST',
            path: 'work-orders/wo-3/transition',
            body: { status: 'completed' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('blocks completion until the pre-work inspection is done', () => {
      // wo-4 is dispatched with no pre-work inspection. Move it to inProgress…
      handleWorkOrders(
        makeContext(store, {
          method: 'POST',
          path: 'work-orders/wo-4/transition',
          body: { status: 'inProgress' },
        }),
      );
      // …then completing must be refused.
      const result = expectHandled(
        handleWorkOrders(
          makeContext(store, {
            method: 'POST',
            path: 'work-orders/wo-4/transition',
            body: { status: 'completed' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('allows completion once the pre-work inspection exists', () => {
      // wo-1 is inProgress and already has a completed pre-work inspection.
      const result = expectHandled(
        handleWorkOrders(
          makeContext(store, {
            method: 'POST',
            path: 'work-orders/wo-1/transition',
            body: { status: 'completed' },
          }),
        ),
      );
      const updated = result.body as WorkOrder;
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeTruthy();
    });
  });

  describe('inspection', () => {
    it('hands back a blank template when none exists yet', () => {
      const result = expectHandled(
        handleWorkOrders(makeContext(store, { path: 'work-orders/wo-3/inspection/preWork' })),
      );
      const inspection = result.body as Inspection;
      expect(inspection.completedAt).toBeUndefined();
      expect(inspection.items.length).toBeGreaterThan(0);
      // Prompts are i18n keys, not resolved copy.
      expect(inspection.items[0]!.prompt).toContain('inspection.pre');
    });

    it('saves responses and stamps completion', () => {
      const result = expectHandled(
        handleWorkOrders(
          makeContext(store, {
            method: 'POST',
            path: 'work-orders/wo-3/inspection/preWork',
            body: {
              items: [{ id: 'pre-1', response: 'true', photoUrls: [] }],
              notes: 'Cleared.',
              inspectorName: 'Bilal Najjar',
              signatureUrl: 'data:image/png;base64,AAAA',
            },
          }),
        ),
      );
      const updated = result.body as WorkOrder;
      expect(updated.preWorkInspection?.completedAt).toBeTruthy();
      expect(updated.preWorkInspection?.items.find((i) => i.id === 'pre-1')?.response).toBe('true');
      expect(updated.preWorkInspection?.signatureUrl).toBe('data:image/png;base64,AAAA');
    });

    it('rejects an unknown inspection kind', () => {
      const result = expectHandled(
        handleWorkOrders(makeContext(store, { path: 'work-orders/wo-3/inspection/sideways' })),
      );
      expect(result.status).toBe(400);
    });
  });
});
