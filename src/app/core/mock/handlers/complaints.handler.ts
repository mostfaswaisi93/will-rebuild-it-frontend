import { Complaint, ComplaintReasons } from '@core/models';
import { MockHandler, badRequest, created, notFound, ok, paginate } from '../mock-types';

interface CreateComplaintBody {
  teamId?: string;
  teamName?: string;
  projectId?: string;
  description?: string;
  reasons?: Partial<ComplaintReasons>;
}

export const handleComplaints: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'complaints') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items: Complaint[] = ctx.store.complaints;
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((complaint) => complaint.status === status);
    }
    return ok(paginate(items, ctx));
  }

  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const body = (ctx.body ?? {}) as CreateComplaintBody;
    const team = ctx.store.teams.find((candidate) => candidate.id === body.teamId);
    const complaint: Complaint = {
      id: `complaint-${Date.now()}`,
      complaintNumber: `CMP-2026-${String(ctx.store.complaints.length + 10).padStart(5, '0')}`,
      teamId: body.teamId ?? '',
      teamName: body.teamName ?? team?.name ?? '',
      projectId: body.projectId,
      description: body.description ?? '',
      reasons: {
        delay: body.reasons?.delay ?? false,
        poorQuality: body.reasons?.poorQuality ?? false,
        specificationMismatch: body.reasons?.specificationMismatch ?? false,
        misconduct: body.reasons?.misconduct ?? false,
        otherReason: body.reasons?.otherReason ?? false,
        otherReasonDetail: body.reasons?.otherReasonDetail,
      },
      attachments: [],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    ctx.store.complaints.unshift(complaint);
    return created(complaint);
  }

  // POST /complaints/:id/respond — the operator's reply closes the complaint
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'respond') {
    const complaint = ctx.store.complaints.find((candidate) => candidate.id === ctx.segments[1]);
    if (!complaint) {
      return notFound(`Complaint ${ctx.segments[1]} not found.`);
    }
    if (complaint.status === 'closed') {
      return badRequest('This complaint has already been answered.');
    }
    const responseBody = (ctx.body as { responseBody?: string } | null)?.responseBody?.trim();
    if (!responseBody) {
      return badRequest('A response is required.');
    }
    complaint.responseBody = responseBody;
    complaint.status = 'closed';
    return ok(complaint);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    const complaint = ctx.store.complaints.find((candidate) => candidate.id === ctx.segments[1]);
    return complaint ? ok(complaint) : notFound(`Complaint ${ctx.segments[1]} not found.`);
  }

  return undefined;
};
