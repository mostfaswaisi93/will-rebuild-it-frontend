import { Shipment } from '@core/models';
import { ShipmentPage } from '@core/api/shipments-api.service';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleShipments } from './shipments.handler';

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

describe('shipments handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores unrelated roots', () => {
    expect(handleShipments(makeContext(store, { path: 'warehouses' }))).toBeUndefined();
  });

  it('summarises crossing, transit and delivered counts', () => {
    const page = expectHandled(
      handleShipments(makeContext(store, { path: 'shipments', query: { pageSize: '50' } })),
    ).body as ShipmentPage;
    const s = store.shipments;
    expect(page.summary.inTransit).toBe(s.filter((x) => x.status === 'inTransit').length);
    expect(page.summary.delivered).toBe(s.filter((x) => x.status === 'delivered').length);
    expect(page.summary.atCrossing).toBe(
      s.filter((x) => x.status === 'awaitingClearance' || x.status === 'atCrossing').length,
    );
  });

  it('filters by status and crossing', () => {
    const page = expectHandled(
      handleShipments(
        makeContext(store, { path: 'shipments', query: { status: 'delivered', crossing: 'rafah', pageSize: '50' } }),
      ),
    ).body as ShipmentPage;
    expect(page.items.every((x) => x.status === 'delivered' && x.crossing === 'rafah')).toBeTrue();
  });

  it('advances a shipment and stamps deliveredAt on delivery', () => {
    const before = store.shipments.find((x) => x.id === 'ship-4')!;
    expect(before.deliveredAt).toBeUndefined();
    const updated = expectHandled(
      handleShipments(
        makeContext(store, { method: 'POST', path: 'shipments/ship-4/advance', body: { status: 'delivered' } }),
      ),
    ).body as Shipment;
    expect(updated.status).toBe('delivered');
    expect(updated.deliveredAt).toBeDefined();
  });

  it('rejects an invalid status', () => {
    expect(
      expectHandled(
        handleShipments(
          makeContext(store, { method: 'POST', path: 'shipments/ship-4/advance', body: { status: 'nope' } }),
        ),
      ).status,
    ).toBe(400);
  });

  it('refuses to advance a delivered shipment', () => {
    expect(
      expectHandled(
        handleShipments(
          makeContext(store, { method: 'POST', path: 'shipments/ship-3/advance', body: { status: 'inTransit' } }),
        ),
      ).status,
    ).toBe(400);
  });

  it('404s for an unknown shipment', () => {
    expect(expectHandled(handleShipments(makeContext(store, { path: 'shipments/nope' }))).status).toBe(404);
  });
});
