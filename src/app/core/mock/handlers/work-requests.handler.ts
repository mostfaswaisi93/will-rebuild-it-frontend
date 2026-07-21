import { ReconstructionRequest } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

/** A request with no assigned team is an operator's to-do. */
function isUnassigned(request: ReconstructionRequest): boolean {
  return !request.assignedTeamId;
}

function summarise(requests: ReconstructionRequest[]) {
  return {
    total: requests.length,
    unassigned: requests.filter(isUnassigned).length,
    matched: requests.filter((request) => request.status === 'matched').length,
    accepted: requests.filter((request) => request.status === 'accepted').length,
  };
}

export const handleWorkRequests: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'work-requests') {
    return undefined;
  }

  // POST /work-requests/:id/assign — assign a team, move to `matched`.
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'assign') {
    const request = ctx.store.requests.find((candidate) => candidate.id === ctx.segments[1]);
    if (!request) {
      return notFound(`Request ${ctx.segments[1]} not found.`);
    }
    const { teamId } = (ctx.body ?? {}) as { teamId?: string };
    const team = teamId ? ctx.store.teams.find((candidate) => candidate.id === teamId) : undefined;
    if (!team) {
      return badRequest('A valid team is required.');
    }

    request.assignedTeamId = team.id;
    request.status = 'matched';
    // Assigning is a decision, so the chosen team is `assigned` while any other
    // previously-suggested teams stay as suggestions.
    const already = request.matchedTeams.find((candidate) => candidate.teamId === team.id);
    if (already) {
      already.status = 'assigned';
    } else {
      request.matchedTeams = [
        ...request.matchedTeams,
        { teamId: team.id, teamName: team.name, matchScore: 1, status: 'assigned' },
      ];
    }
    return ok(request);
  }

  // POST /work-requests/:id/reject
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'reject') {
    const request = ctx.store.requests.find((candidate) => candidate.id === ctx.segments[1]);
    if (!request) {
      return notFound(`Request ${ctx.segments[1]} not found.`);
    }
    request.status = 'rejected';
    return ok(request);
  }

  if (ctx.method !== 'GET') {
    return undefined;
  }

  // GET /work-requests/:id
  if (ctx.segments.length === 2) {
    const request = ctx.store.requests.find((candidate) => candidate.id === ctx.segments[1]);
    return request ? ok(request) : notFound(`Request ${ctx.segments[1]} not found.`);
  }

  // GET /work-requests — filtered, paged, with a summary over the *filtered*
  // set so the cards always match what the table is showing.
  if (ctx.segments.length === 1) {
    let items = [...ctx.store.requests];

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((request) => request.status === status);
    }
    const severity = ctx.query.get('severity');
    if (severity) {
      items = items.filter((request) => request.severity === severity);
    }
    const governorate = ctx.query.get('governorate');
    if (governorate) {
      items = items.filter((request) => request.address.governorate === governorate);
    }
    const type = ctx.query.get('type');
    if (type) {
      items = items.filter((request) => request.type === type);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (request) =>
          request.requestNumber.toLowerCase().includes(searchKey) ||
          request.description.toLowerCase().includes(searchKey) ||
          request.contactName.toLowerCase().includes(searchKey),
      );
    }

    // Newest first — an operator works the freshest requests.
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const summary = summarise(items);
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
