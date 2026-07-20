import { DamageSeverity, PropertyType, ReconstructionRequest } from '@core/models';
import { MockHandler, created, notFound, ok, paginate } from '../mock-types';

interface CreateRequestBody {
  type?: 'assessment' | 'reconstruction';
  propertyType?: PropertyType;
  severity?: DamageSeverity;
  description?: string;
  teamId?: string;
  contactName?: string;
  contactPhone?: string;
  address?: ReconstructionRequest['address'];
}

function buildRequest(ctx: Parameters<MockHandler>[0], body: CreateRequestBody): ReconstructionRequest {
  const now = new Date().toISOString();
  const seq = String(ctx.store.requests.length + 200).padStart(5, '0');
  const team = ctx.store.teams.find((candidate) => candidate.id === body.teamId);
  return {
    id: `request-${Date.now()}`,
    requestNumber: `REQ-2026-${seq}`,
    type: body.type ?? 'assessment',
    status: body.teamId ? 'matched' : 'underReview',
    propertyType: body.propertyType ?? 'residential',
    severity: body.severity ?? 'partial',
    description: body.description ?? '',
    address: body.address ?? { governorate: 'gazaCity', district: '' },
    attachments: [],
    contactName: body.contactName ?? ctx.store.beneficiaryProfile.firstName + ' ' + ctx.store.beneficiaryProfile.lastName,
    contactPhone: body.contactPhone ?? ctx.store.beneficiaryProfile.phone,
    assignedTeamId: body.teamId,
    matchedTeams: team ? [{ teamId: team.id, teamName: team.name, matchScore: 0.9, status: 'assigned' }] : [],
    createdAt: now,
  };
}

export const handleRequests: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'requests') {
    return undefined;
  }

  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const request = buildRequest(ctx, (ctx.body ?? {}) as CreateRequestBody);
    ctx.store.requests.unshift(request);
    return created(request);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 2 && ctx.segments[1] === 'damage-report') {
    const request = buildRequest(ctx, (ctx.body ?? {}) as CreateRequestBody);
    ctx.store.requests.unshift(request);
    return created(request);
  }

  if (ctx.method !== 'GET') {
    return undefined;
  }

  if (ctx.segments.length === 1) {
    let items: ReconstructionRequest[] = ctx.store.requests;

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((request) => request.status === status);
    }

    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (request) =>
          request.requestNumber.toLowerCase().includes(searchKey) ||
          request.description.toLowerCase().includes(searchKey),
      );
    }

    return ok(paginate(items, ctx));
  }

  if (ctx.segments.length === 2) {
    const request = ctx.store.requests.find((candidate) => candidate.id === ctx.segments[1]);
    return request ? ok(request) : notFound(`Request ${ctx.segments[1]} not found.`);
  }

  return undefined;
};
