import {
  Equipment,
  EQUIPMENT_STATUSES,
  EquipmentProblemSeverity,
  EquipmentStatus,
} from '@core/models';
import { MockHandler, badRequest, conflict, created, notFound, ok } from '../mock-types';

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

/** Create/update payload — bookings and problems are never set this way. */
interface EquipmentBody {
  code?: string;
  name?: string;
  category?: Equipment['category'];
  status?: EquipmentStatus;
  location?: string;
  dailyRate?: number;
  currency?: string;
}

export const handleEquipment: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'equipment') {
    return undefined;
  }

  // GET /equipment/schedule — full fleet for the timeline
  if (ctx.method === 'GET' && ctx.segments.length === 2 && ctx.segments[1] === 'schedule') {
    return ok(ctx.store.equipment);
  }

  // POST /equipment — register a new machine
  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const body = (ctx.body ?? {}) as EquipmentBody;
    const name = body.name?.trim();
    const code = body.code?.trim();
    if (!name || !code) {
      return badRequest('Equipment code and name are required.');
    }
    if (ctx.store.equipment.some((e) => e.code.toLowerCase() === code.toLowerCase())) {
      return conflict(`Equipment code ${code} is already in use.`);
    }
    const machine: Equipment = {
      id: `eq-${Date.now()}`,
      code,
      name,
      category: body.category ?? 'excavator',
      status: body.status ?? 'available',
      location: body.location?.trim() ?? '',
      dailyRate: Number(body.dailyRate) || 0,
      currency: body.currency ?? 'USD',
      bookings: [],
      problems: [],
      createdAt: new Date().toISOString(),
    };
    ctx.store.equipment.push(machine);
    return created(machine);
  }

  const item = ctx.segments[1]
    ? ctx.store.equipment.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // PUT /equipment/:id — edit the machine's own fields
  if (ctx.method === 'PUT' && ctx.segments.length === 2) {
    if (!item) {
      return notFound(`Equipment ${ctx.segments[1]} not found.`);
    }
    const body = (ctx.body ?? {}) as EquipmentBody;
    const code = body.code?.trim();
    if (code && ctx.store.equipment.some((e) => e.id !== item.id && e.code.toLowerCase() === code.toLowerCase())) {
      return conflict(`Equipment code ${code} is already in use.`);
    }
    if (code) {
      item.code = code;
    }
    if (body.name?.trim()) {
      item.name = body.name.trim();
    }
    if (body.category) {
      item.category = body.category;
    }
    if (body.location !== undefined) {
      item.location = body.location.trim();
    }
    if (body.dailyRate !== undefined) {
      item.dailyRate = Number(body.dailyRate) || 0;
    }
    return ok(item);
  }

  // DELETE /equipment/:id/bookings/:bookingId — release a booking early
  //
  // Ports the legacy "drop equipment" screen. Without it a booking, once made,
  // held the machine forever: a job that finished early or moved could not give
  // the machine back, and the scheduler would keep refusing overlapping
  // bookings against a commitment nobody was using.
  if (ctx.method === 'DELETE' && ctx.segments.length === 4 && ctx.segments[2] === 'bookings') {
    if (!item) {
      return notFound(`Equipment ${ctx.segments[1]} not found.`);
    }
    const booking = item.bookings.find((candidate) => candidate.id === ctx.segments[3]);
    if (!booking) {
      return notFound(`Booking ${ctx.segments[3]} not found.`);
    }
    item.bookings = item.bookings.filter((candidate) => candidate.id !== ctx.segments[3]);

    // Mirror of the create rule: a machine held only by this commitment is free
    // again. `inUse`, `maintenance` and `outOfService` are left alone — those
    // say something about the machine, not about its calendar.
    if (item.status === 'booked' && item.bookings.length === 0) {
      item.status = 'available';
    }
    return ok(item);
  }

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
