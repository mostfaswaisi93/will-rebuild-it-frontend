import { SUPPLIER_STATUSES, SupplierStatus } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

export const handleSuppliers: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'suppliers') {
    return undefined;
  }

  const supplier = ctx.segments[1]
    ? ctx.store.suppliers.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'status') {
    if (!supplier) {
      return notFound(`Supplier ${ctx.segments[1]} not found.`);
    }
    const { status } = (ctx.body ?? {}) as { status?: SupplierStatus };
    if (!status || !SUPPLIER_STATUSES.includes(status)) {
      return badRequest('A valid status is required.');
    }
    supplier.status = status;
    return ok(supplier);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return supplier ? ok(supplier) : notFound(`Supplier ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.suppliers];

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((s) => s.status === status);
    }
    const category = ctx.query.get('category');
    if (category) {
      items = items.filter((s) => s.categories.includes(category as (typeof s.categories)[number]));
    }
    const governorate = ctx.query.get('governorate');
    if (governorate) {
      items = items.filter((s) => s.address.governorate === governorate);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(searchKey) ||
          s.contactName.toLowerCase().includes(searchKey),
      );
    }

    items.sort((a, b) => a.name.localeCompare(b.name));

    const pageNo = Number(ctx.query.get('pageNo') ?? '1') || 1;
    const pageSize = Number(ctx.query.get('pageSize') ?? '10') || 10;
    const start = (pageNo - 1) * pageSize;
    return ok({
      items: items.slice(start, start + pageSize),
      totalCount: items.length,
      pageNo,
      pageSize,
    });
  }

  return undefined;
};
