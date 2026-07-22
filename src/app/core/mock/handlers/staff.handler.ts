import { STAFF_STATUSES, StaffStatus } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

export const handleStaff: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'staff') {
    return undefined;
  }

  const member = ctx.segments[1]
    ? ctx.store.staff.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'status') {
    if (!member) {
      return notFound(`Staff ${ctx.segments[1]} not found.`);
    }
    const { status } = (ctx.body ?? {}) as { status?: StaffStatus };
    if (!status || !STAFF_STATUSES.includes(status)) {
      return badRequest('A valid status is required.');
    }
    member.status = status;
    return ok(member);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return member ? ok(member) : notFound(`Staff ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.staff];
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((s) => s.status === status);
    }
    const teamId = ctx.query.get('teamId');
    if (teamId) {
      items = items.filter((s) => s.teamId === teamId);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(searchKey) ||
          s.jobTitle.toLowerCase().includes(searchKey),
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
