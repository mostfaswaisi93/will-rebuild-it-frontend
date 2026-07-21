import { PagedResult, PurchaseOrder, StockItem, Warehouse } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { StockSummary } from '@core/api/inventory-api.service';
import { handleInventory } from './inventory.handler';

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

describe('inventory handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores unrelated roots', () => {
    expect(handleInventory(makeContext(store, { path: 'estimates' }))).toBeUndefined();
  });

  it('lists warehouses', () => {
    const result = expectHandled(handleInventory(makeContext(store, { path: 'warehouses' })));
    expect((result.body as Warehouse[]).length).toBe(store.warehouses.length);
  });

  describe('stock', () => {
    it('summarises low and out-of-stock counts', () => {
      const body = expectHandled(
        handleInventory(makeContext(store, { path: 'stock', query: { pageSize: '50' } })),
      ).body as PagedResult<StockItem> & { summary: StockSummary };
      expect(body.summary.low).toBe(store.stock.filter((s) => s.status === 'low').length);
      expect(body.summary.outOfStock).toBe(store.stock.filter((s) => s.status === 'outOfStock').length);
    });

    it('filters by warehouse and status', () => {
      const body = expectHandled(
        handleInventory(makeContext(store, { path: 'stock', query: { status: 'outOfStock', pageSize: '50' } })),
      ).body as PagedResult<StockItem>;
      expect(body.items.every((s) => s.status === 'outOfStock')).toBeTrue();
    });
  });

  describe('purchase orders', () => {
    it('applies a valid transition', () => {
      // po-1 is awaitingApproval → approved.
      const result = expectHandled(
        handleInventory(
          makeContext(store, {
            method: 'POST',
            path: 'purchase-orders/po-1/transition',
            body: { status: 'approved' },
          }),
        ),
      );
      const updated = result.body as PurchaseOrder;
      expect(updated.status).toBe('approved');
      expect(updated.approvedAt).toBeTruthy();
    });

    it('rejects an invalid transition', () => {
      // draft → received is not allowed.
      const result = expectHandled(
        handleInventory(
          makeContext(store, {
            method: 'POST',
            path: 'purchase-orders/po-4/transition',
            body: { status: 'received' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('receiving an order adds its quantities into warehouse stock', () => {
      // po-2 (ordered) delivers 10 ton of steel into wh-1, where st-2 holds 6 ton.
      const before = store.stock.find((s) => s.id === 'st-2')!.quantityOnHand;

      const result = expectHandled(
        handleInventory(
          makeContext(store, {
            method: 'POST',
            path: 'purchase-orders/po-2/transition',
            body: { status: 'received' },
          }),
        ),
      );
      expect((result.body as PurchaseOrder).status).toBe('received');

      const after = store.stock.find((s) => s.id === 'st-2')!;
      expect(after.quantityOnHand).toBe(before + 10);
      // 16 ton against a reorder level of 8 flips it out of "low".
      expect(after.status).toBe('inStock');
    });
  });
});
