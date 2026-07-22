import { SHIPMENT_STATUSES, Shipment } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

function summarise(shipments: Shipment[]) {
  return {
    atCrossing: shipments.filter(
      (s) => s.status === 'awaitingClearance' || s.status === 'atCrossing',
    ).length,
    inTransit: shipments.filter((s) => s.status === 'inTransit').length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
  };
}

export const handleShipments: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'shipments') {
    return undefined;
  }

  const shipment = ctx.segments[1]
    ? ctx.store.shipments.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /shipments/:id/advance — move to the given status
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'advance') {
    if (!shipment) {
      return notFound(`Shipment ${ctx.segments[1]} not found.`);
    }
    const status = (ctx.body as { status?: string } | null)?.status;
    if (!status || !SHIPMENT_STATUSES.includes(status as (typeof SHIPMENT_STATUSES)[number])) {
      return badRequest('A valid shipment status is required.');
    }
    if (shipment.status === 'delivered' || shipment.status === 'rejected') {
      return badRequest('A delivered or rejected shipment cannot change state.');
    }
    shipment.status = status as Shipment['status'];
    if (status === 'delivered') {
      shipment.deliveredAt = new Date().toISOString();
    }
    return ok(shipment);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return shipment ? ok(shipment) : notFound(`Shipment ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.shipments];
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((s) => s.status === status);
    }
    const crossing = ctx.query.get('crossing');
    if (crossing) {
      items = items.filter((s) => s.crossing === crossing);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (s) =>
          s.shipmentNumber.toLowerCase().includes(searchKey) ||
          s.supplierName.toLowerCase().includes(searchKey) ||
          s.destinationWarehouseName.toLowerCase().includes(searchKey),
      );
    }

    const summary = summarise(items);
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const pageNo = Number(ctx.query.get('pageNo') ?? '1') || 1;
    const pageSize = Number(ctx.query.get('pageSize') ?? '10') || 10;
    const start = (pageNo - 1) * pageSize;
    return ok({
      items: items.slice(start, start + pageSize),
      totalCount: items.length,
      pageNo,
      pageSize,
      summary,
    });
  }

  return undefined;
};
