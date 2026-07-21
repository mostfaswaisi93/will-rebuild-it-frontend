import { BoqCategory, PricebookItem } from '@core/models';
import { MockHandler, badRequest, conflict, created, notFound, ok } from '../mock-types';

interface ItemBody {
  code?: string;
  category?: BoqCategory;
  description?: string;
  unit?: string;
  unitRate?: number;
}

/** Codes are the catalogue's human key, so they must stay unique. */
function codeTaken(ctx: Parameters<MockHandler>[0], code: string, exceptId?: string): boolean {
  const normalised = code.trim().toLowerCase();
  return ctx.store.pricebook.some(
    (item) => item.id !== exceptId && item.code.toLowerCase() === normalised,
  );
}

function validate(body: ItemBody): string | null {
  if (!body.code?.trim() || !body.description?.trim() || !body.unit?.trim()) {
    return 'Code, description and unit are required.';
  }
  if (typeof body.unitRate !== 'number' || body.unitRate < 0) {
    return 'A non-negative unit rate is required.';
  }
  return null;
}

export const handlePricebook: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'pricebook') {
    return undefined;
  }

  const item = ctx.segments[1]
    ? ctx.store.pricebook.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /pricebook — create
  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const body = (ctx.body ?? {}) as ItemBody;
    const error = validate(body);
    if (error) {
      return badRequest(error);
    }
    if (codeTaken(ctx, body.code!)) {
      return conflict('An item with this code already exists.');
    }
    const record: PricebookItem = {
      id: `pb-${Date.now()}`,
      code: body.code!.trim(),
      category: body.category ?? 'materials',
      description: body.description!.trim(),
      unit: body.unit!.trim(),
      unitRate: body.unitRate!,
      active: true,
      updatedAt: new Date().toISOString(),
    };
    ctx.store.pricebook.unshift(record);
    return created(record);
  }

  // PUT /pricebook/:id — update
  if (ctx.method === 'PUT' && ctx.segments.length === 2) {
    if (!item) {
      return notFound(`Pricebook item ${ctx.segments[1]} not found.`);
    }
    const body = (ctx.body ?? {}) as ItemBody;
    const error = validate(body);
    if (error) {
      return badRequest(error);
    }
    if (codeTaken(ctx, body.code!, item.id)) {
      return conflict('An item with this code already exists.');
    }
    item.code = body.code!.trim();
    item.category = body.category ?? item.category;
    item.description = body.description!.trim();
    item.unit = body.unit!.trim();
    item.unitRate = body.unitRate!;
    item.updatedAt = new Date().toISOString();
    return ok(item);
  }

  // POST /pricebook/:id/active — toggle
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'active') {
    if (!item) {
      return notFound(`Pricebook item ${ctx.segments[1]} not found.`);
    }
    const { active } = (ctx.body ?? {}) as { active?: boolean };
    item.active = active ?? !item.active;
    item.updatedAt = new Date().toISOString();
    return ok(item);
  }

  // GET /pricebook
  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.pricebook];

    const category = ctx.query.get('category');
    if (category) {
      items = items.filter((entry) => entry.category === category);
    }
    const active = ctx.query.get('active');
    if (active === 'active') {
      items = items.filter((entry) => entry.active);
    } else if (active === 'inactive') {
      items = items.filter((entry) => !entry.active);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (entry) =>
          entry.code.toLowerCase().includes(searchKey) ||
          entry.description.toLowerCase().includes(searchKey),
      );
    }

    items.sort((a, b) => a.code.localeCompare(b.code));

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
