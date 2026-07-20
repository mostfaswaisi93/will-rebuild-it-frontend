import { Funding } from '@core/models';
import { MockHandler, notFound, ok, paginate } from '../mock-types';

export const handleFunding: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'funding') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items: Funding[] = ctx.store.funding;

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((funding) => funding.status === status);
    }

    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (funding) =>
          funding.fundingNumber.toLowerCase().includes(searchKey) ||
          funding.projectTitle.toLowerCase().includes(searchKey),
      );
    }

    return ok(paginate(items, ctx));
  }

  const funding = ctx.store.funding.find((candidate) => candidate.id === ctx.segments[1]);

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return funding ? ok(funding) : notFound(`Funding ${ctx.segments[1]} not found.`);
  }

  if (
    ctx.method === 'GET' &&
    ctx.segments.length === 4 &&
    ctx.segments[2] === 'disbursements'
  ) {
    if (!funding) {
      return notFound(`Funding ${ctx.segments[1]} not found.`);
    }
    const disbursement = funding.disbursements.find((candidate) => candidate.id === ctx.segments[3]);
    return disbursement ? ok(disbursement) : notFound(`Disbursement ${ctx.segments[3]} not found.`);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'confirm-receipt') {
    if (!funding) {
      return notFound(`Funding ${ctx.segments[1]} not found.`);
    }
    funding.receiptConfirmedAt = new Date().toISOString();
    return ok(funding);
  }

  return undefined;
};
