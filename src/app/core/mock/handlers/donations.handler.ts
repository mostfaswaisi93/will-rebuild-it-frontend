import { Donation } from '@core/models';
import { MockHandler, created, notFound, ok, paginate } from '../mock-types';

interface CreateDonationBody {
  amount?: number;
  currency?: string;
  frequency?: 'once' | 'monthly';
  projectId?: string;
  projectTitle?: string;
  donorName?: string;
  isAnonymous?: boolean;
}

export const handleDonations: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'donations') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items: Donation[] = ctx.store.donations;

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((donation) => donation.status === status);
    }

    return ok(paginate(items, ctx));
  }

  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const body = (ctx.body ?? {}) as CreateDonationBody;
    const donation: Donation = {
      id: `donation-${Date.now()}`,
      amount: body.amount ?? 0,
      currency: body.currency ?? 'USD',
      frequency: body.frequency ?? 'once',
      status: 'succeeded',
      projectId: body.projectId,
      projectTitle: body.projectTitle,
      donorName: body.donorName ?? 'Anonymous',
      isAnonymous: body.isAnonymous ?? false,
      receiptUrl: `/receipts/donation-${Date.now()}.pdf`,
      createdAt: new Date().toISOString(),
    };
    ctx.store.donations.unshift(donation);
    return created(donation);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    const donation = ctx.store.donations.find((candidate) => candidate.id === ctx.segments[1]);
    return donation ? ok(donation) : notFound(`Donation ${ctx.segments[1]} not found.`);
  }

  return undefined;
};
