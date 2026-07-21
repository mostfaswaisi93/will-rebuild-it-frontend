import { PurchaseOrder, PurchaseOrderStatus, StockItem } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

/** Purchase-order lifecycle. Receiving is what lands materials in stock. */
const PO_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['awaitingApproval', 'cancelled'],
  awaitingApproval: ['approved', 'cancelled'],
  approved: ['ordered', 'cancelled'],
  ordered: ['partiallyReceived', 'received', 'cancelled'],
  partiallyReceived: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

function stockSummary(items: StockItem[]) {
  return {
    total: items.length,
    low: items.filter((item) => item.status === 'low').length,
    outOfStock: items.filter((item) => item.status === 'outOfStock').length,
  };
}

function pageOf<T>(items: T[], ctx: Parameters<MockHandler>[0]) {
  const pageNo = Number(ctx.query.get('pageNo') ?? '1') || 1;
  const pageSize = Number(ctx.query.get('pageSize') ?? '10') || 10;
  const start = (pageNo - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), totalCount: items.length, pageNo, pageSize };
}

/** Adds received PO quantities into the destination warehouse's stock. */
function receiveIntoStock(ctx: Parameters<MockHandler>[0], order: PurchaseOrder): void {
  for (const line of order.lines) {
    const existing = ctx.store.stock.find(
      (item) => item.warehouseId === order.warehouseId && item.description === line.description,
    );
    if (existing) {
      existing.quantityOnHand += line.quantity;
      existing.status =
        existing.quantityOnHand <= 0
          ? 'outOfStock'
          : existing.quantityOnHand <= existing.reorderLevel
            ? 'low'
            : 'inStock';
    } else {
      ctx.store.stock.push({
        id: `st-${Date.now()}-${line.id}`,
        warehouseId: order.warehouseId,
        warehouseName: order.warehouseName,
        code: `${line.category.toUpperCase()}-${line.id}`,
        description: line.description,
        category: line.category,
        unit: line.unit,
        quantityOnHand: line.quantity,
        reorderLevel: 0,
        status: 'inStock',
      });
    }
  }
}

export const handleInventory: MockHandler = (ctx) => {
  const root = ctx.segments[0];

  // GET /warehouses
  if (root === 'warehouses' && ctx.method === 'GET' && ctx.segments.length === 1) {
    return ok(ctx.store.warehouses);
  }

  // GET /stock
  if (root === 'stock' && ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.stock];
    const warehouseId = ctx.query.get('warehouseId');
    if (warehouseId) {
      items = items.filter((item) => item.warehouseId === warehouseId);
    }
    const category = ctx.query.get('category');
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((item) => item.status === status);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (item) =>
          item.code.toLowerCase().includes(searchKey) ||
          item.description.toLowerCase().includes(searchKey),
      );
    }
    const summary = stockSummary(items);
    items.sort((a, b) => a.code.localeCompare(b.code));
    return ok({ ...pageOf(items, ctx), summary });
  }

  if (root !== 'purchase-orders') {
    return undefined;
  }

  const order = ctx.segments[1]
    ? ctx.store.purchaseOrders.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /purchase-orders/:id/transition
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'transition') {
    if (!order) {
      return notFound(`Purchase order ${ctx.segments[1]} not found.`);
    }
    const { status } = (ctx.body ?? {}) as { status?: PurchaseOrderStatus };
    if (!status || !PO_TRANSITIONS[order.status].includes(status)) {
      return badRequest(`Cannot move a ${order.status} purchase order to ${status}.`);
    }
    order.status = status;
    if (status === 'approved') {
      order.approvedAt = new Date().toISOString();
    }
    if (status === 'received') {
      order.receivedAt = new Date().toISOString();
      receiveIntoStock(ctx, order);
    }
    return ok(order);
  }

  // GET /purchase-orders/:id
  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return order ? ok(order) : notFound(`Purchase order ${ctx.segments[1]} not found.`);
  }

  // GET /purchase-orders
  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.purchaseOrders];
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((po) => po.status === status);
    }
    const supplierId = ctx.query.get('supplierId');
    if (supplierId) {
      items = items.filter((po) => po.supplierId === supplierId);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(searchKey) ||
          po.supplierName.toLowerCase().includes(searchKey),
      );
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok(pageOf(items, ctx));
  }

  return undefined;
};
