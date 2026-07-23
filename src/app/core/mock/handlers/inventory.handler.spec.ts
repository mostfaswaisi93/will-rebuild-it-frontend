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

  describe('detail lookups', () => {
    it('returns a warehouse with only its own stock and a matching summary', () => {
      const warehouse = store.warehouses[0];
      const result = expectHandled(
        handleInventory(makeContext(store, { path: `warehouses/${warehouse.id}` })),
      );

      const body = result.body as Warehouse & { stock: StockItem[]; summary: StockSummary };
      expect(body.id).toBe(warehouse.id);
      expect(body.stock.every((item) => item.warehouseId === warehouse.id)).toBeTrue();
      expect(body.summary.total).toBe(body.stock.length);
    });

    it('404s for an unknown warehouse', () => {
      expect(
        expectHandled(handleInventory(makeContext(store, { path: 'warehouses/nope' }))).status,
      ).toBe(404);
    });

    it('returns a single stock item', () => {
      const item = store.stock[0];
      const result = expectHandled(
        handleInventory(makeContext(store, { path: `stock/${item.id}` })),
      );
      expect((result.body as StockItem).id).toBe(item.id);
    });

    it('404s for an unknown stock item', () => {
      expect(expectHandled(handleInventory(makeContext(store, { path: 'stock/nope' }))).status).toBe(
        404,
      );
    });
  });

  describe('raising a purchase order', () => {
    function body(overrides: Record<string, unknown> = {}) {
      return {
        supplierId: store.suppliers[0].id,
        warehouseId: store.warehouses[0].id,
        lines: [
          { description: 'Cement', category: 'cement', quantity: 10, unit: 'bag', unitRate: 8 },
          { description: 'Steel', category: 'steel', quantity: 2, unit: 'tonne', unitRate: 700 },
        ],
        ...overrides,
      };
    }

    it('creates a draft order and computes line amounts and subtotal', () => {
      const before = store.purchaseOrders.length;
      const result = expectHandled(
        handleInventory(makeContext(store, { method: 'POST', path: 'purchase-orders', body: body() })),
      );

      expect(result.status).toBe(201);
      const order = result.body as PurchaseOrder;
      expect(order.status).toBe('draft');
      expect(order.supplierName).toBe(store.suppliers[0].name);
      expect(order.lines[0].amount).toBe(80);
      expect(order.lines[1].amount).toBe(1400);
      expect(order.subtotal).toBe(1480);
      expect(store.purchaseOrders.length).toBe(before + 1);
    });

    it('rejects an unknown supplier or warehouse', () => {
      expect(
        expectHandled(
          handleInventory(
            makeContext(store, { method: 'POST', path: 'purchase-orders', body: body({ supplierId: 'nope' }) }),
          ),
        ).status,
      ).toBe(400);
    });

    it('rejects an order with no usable lines', () => {
      expect(
        expectHandled(
          handleInventory(
            makeContext(store, {
              method: 'POST',
              path: 'purchase-orders',
              body: body({ lines: [{ description: '   ', quantity: 0 }] }),
            }),
          ),
        ).status,
      ).toBe(400);
    });
  });
});
