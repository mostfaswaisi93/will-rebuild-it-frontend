import { Estimate } from '@core/models';
import { MockHandler, notFound, ok, paginate } from '../mock-types';

interface DecisionBody {
  signatureImage?: string;
  rejectionReason?: string;
}

export const handleEstimates: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'estimates') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items: Estimate[] = ctx.store.estimates;

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((estimate) => estimate.status === status);
    }

    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (estimate) =>
          estimate.estimateNumber.toLowerCase().includes(searchKey) ||
          estimate.projectTitle.toLowerCase().includes(searchKey),
      );
    }

    return ok(paginate(items, ctx));
  }

  const estimate = ctx.store.estimates.find((candidate) => candidate.id === ctx.segments[1]);

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return estimate ? ok(estimate) : notFound(`Estimate ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'approve') {
    if (!estimate) {
      return notFound(`Estimate ${ctx.segments[1]} not found.`);
    }
    estimate.status = 'approved';
    estimate.approvedAt = new Date().toISOString();
    return ok(estimate);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'reject') {
    if (!estimate) {
      return notFound(`Estimate ${ctx.segments[1]} not found.`);
    }
    const body = (ctx.body ?? {}) as DecisionBody;
    estimate.status = 'rejected';
    estimate.rejectionReason = body.rejectionReason ?? '';
    return ok(estimate);
  }

  return undefined;
};
