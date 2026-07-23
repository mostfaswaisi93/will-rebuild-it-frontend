import { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus, StockItem } from '@core/models';
import { MockHandler, badRequest, created, notFound, ok } from '../mock-types';

/** One line as the create form submits it — `amount` is computed server-side. */
interface PurchaseOrderLineInput {
  description?: string;
  category?: PurchaseOrderLine['category'];
  quantity?: number;
  unit?: string;
  unitRate?: number;
}

interface CreatePurchaseOrderBody {
  supplierId?: string;
  warehouseId?: string;
  expectedDelivery?: string;
  lines?: PurchaseOrderLineInput[];
}

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

  // GET /warehouses/:id — the store plus everything held in it
  if (root === 'warehouses' && ctx.method === 'GET' && ctx.segments.length === 2) {
    const warehouse = ctx.store.warehouses.find((w) => w.id === ctx.segments[1]);
    if (!warehouse) {
      return notFound(`Warehouse ${ctx.segments[1]} not found.`);
    }
    const stock = ctx.store.stock
      .filter((item) => item.warehouseId === warehouse.id)
      .sort((a, b) => a.code.localeCompare(b.code));
    return ok({ ...warehouse, stock, summary: stockSummary(stock) });
  }

  // GET /stock/:id
  if (root === 'stock' && ctx.method === 'GET' && ctx.segments.length === 2) {
    const item = ctx.store.stock.find((candidate) => candidate.id === ctx.segments[1]);
    return item ? ok(item) : notFound(`Stock item ${ctx.segments[1]} not found.`);
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

  // POST /purchase-orders — raise a new order in draft
  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const body = (ctx.body ?? {}) as CreatePurchaseOrderBody;
    const supplier = ctx.store.suppliers.find((s) => s.id === body.supplierId);
    const warehouse = ctx.store.warehouses.find((w) => w.id === body.warehouseId);
    if (!supplier || !warehouse) {
      return badRequest('A valid supplier and warehouse are required.');
    }
    const inputLines = (body.lines ?? []).filter(
      (line) => line.description?.trim() && Number(line.quantity) > 0,
    );
    if (inputLines.length === 0) {
      return badRequest('At least one order line is required.');
    }

    const lines: PurchaseOrderLine[] = inputLines.map((line, index) => {
      const quantity = Number(line.quantity) || 0;
      const unitRate = Number(line.unitRate) || 0;
      return {
        id: `pol-${Date.now()}-${index}`,
        description: line.description!.trim(),
        category: line.category ?? 'cement',
        quantity,
        unit: line.unit ?? 'piece',
        unitRate,
        amount: quantity * unitRate,
      };
    });

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${String(ctx.store.purchaseOrders.length + 1).padStart(4, '0')}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      status: 'draft',
      lines,
      subtotal: lines.reduce((sum, line) => sum + line.amount, 0),
      currency: 'USD',
      expectedDelivery: body.expectedDelivery || undefined,
      createdAt: new Date().toISOString(),
    };
    ctx.store.purchaseOrders.push(newOrder);
    return created(newOrder);
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
