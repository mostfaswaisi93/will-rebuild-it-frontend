import {
  Equipment,
  EQUIPMENT_STATUSES,
  EquipmentProblemSeverity,
  EquipmentStatus,
} from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

/** Statuses that make a machine unavailable to book. */
const UNAVAILABLE: EquipmentStatus[] = ['maintenance', 'outOfService'];

function summarise(items: Equipment[]) {
  return {
    total: items.length,
    available: items.filter((e) => e.status === 'available').length,
    inUse: items.filter((e) => e.status === 'inUse' || e.status === 'booked').length,
    unavailable: items.filter((e) => UNAVAILABLE.includes(e.status)).length,
  };
}

/** True if [aFrom,aTo] and [bFrom,bTo] share any day. */
function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

interface BookBody {
  from?: string;
  to?: string;
  projectTitle?: string;
  workOrderId?: string;
  bookedBy?: string;
}

interface ProblemBody {
  severity?: EquipmentProblemSeverity;
  description?: string;
  reportedBy?: string;
}

export const handleEquipment: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'equipment') {
    return undefined;
  }

  // GET /equipment/schedule — full fleet for the timeline
  if (ctx.method === 'GET' && ctx.segments.length === 2 && ctx.segments[1] === 'schedule') {
    return ok(ctx.store.equipment);
  }

  const item = ctx.segments[1]
    ? ctx.store.equipment.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /equipment/:id/bookings
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'bookings') {
    if (!item) {
      return notFound(`Equipment ${ctx.segments[1]} not found.`);
    }
    const body = (ctx.body ?? {}) as BookBody;
    if (!body.from || !body.to || !body.projectTitle?.trim()) {
      return badRequest('Dates and a project are required.');
    }
    if (body.from > body.to) {
      return badRequest('The start date must be on or before the end date.');
    }
    if (UNAVAILABLE.includes(item.status)) {
      return badRequest('This machine is not available to book.');
    }
    // Double-booking is the failure the scheduler exists to prevent.
    const clash = item.bookings.some((booking) =>
      overlaps(body.from!, body.to!, booking.from, booking.to),
    );
    if (clash) {
      return badRequest('The machine is already booked for part of that period.');
    }

    item.bookings = [
      ...item.bookings,
      {
        id: `eb-${Date.now()}`,
        workOrderId: body.workOrderId,
        projectTitle: body.projectTitle.trim(),
        from: body.from,
        to: body.to,
        bookedBy: body.bookedBy?.trim() || 'Operator',
      },
    ].sort((a, b) => a.from.localeCompare(b.from));

    // An available machine becomes booked once it has a commitment.
    if (item.status === 'available') {
      item.status = 'booked';
    }
    return ok(item);
  }

  // POST /equipment/:id/problems
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'problems') {
    if (!item) {
      return notFound(`Equipment ${ctx.segments[1]} not found.`);
    }
    const body = (ctx.body ?? {}) as ProblemBody;
    if (!body.severity || !body.description?.trim()) {
      return badRequest('A severity and description are required.');
    }
    item.problems = [
      {
        id: `ep-${Date.now()}`,
        severity: body.severity,
        description: body.description.trim(),
        reportedBy: body.reportedBy?.trim() || 'Field staff',
        reportedAt: new Date().toISOString(),
      },
      ...item.problems,
    ];
    // A critical fault takes the machine out of service immediately.
    if (body.severity === 'critical') {
      item.status = 'outOfService';
    }
    return ok(item);
  }

  // POST /equipment/:id/problems/:problemId/resolve
  if (
    ctx.method === 'POST' &&
    ctx.segments.length === 5 &&
    ctx.segments[2] === 'problems' &&
    ctx.segments[4] === 'resolve'
  ) {
    if (!item) {
      return notFound(`Equipment ${ctx.segments[1]} not found.`);
    }
    const problem = item.problems.find((candidate) => candidate.id === ctx.segments[3]);
    if (!problem) {
      return notFound(`Problem ${ctx.segments[3]} not found.`);
    }
    problem.resolvedAt = new Date().toISOString();
    return ok(item);
  }

  // POST /equipment/:id/status
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'status') {
    if (!item) {
      return notFound(`Equipment ${ctx.segments[1]} not found.`);
    }
    const { status } = (ctx.body ?? {}) as { status?: EquipmentStatus };
    if (!status || !EQUIPMENT_STATUSES.includes(status)) {
      return badRequest('A valid status is required.');
    }
    item.status = status;
    return ok(item);
  }

  // GET /equipment/:id
  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return item ? ok(item) : notFound(`Equipment ${ctx.segments[1]} not found.`);
  }

  // GET /equipment
  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.equipment];
    const category = ctx.query.get('category');
    if (category) {
      items = items.filter((e) => e.category === category);
    }
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((e) => e.status === status);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (e) =>
          e.code.toLowerCase().includes(searchKey) || e.name.toLowerCase().includes(searchKey),
      );
    }
    const summary = summarise(items);
    items.sort((a, b) => a.code.localeCompare(b.code));

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
