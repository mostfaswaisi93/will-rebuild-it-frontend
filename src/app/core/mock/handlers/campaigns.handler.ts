import { MockHandler, badRequest, notFound, ok } from '../mock-types';

export const handleCampaigns: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'campaigns') {
    return undefined;
  }

  const campaign = ctx.segments[1]
    ? ctx.store.campaigns.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /campaigns/:id/send — launch now
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'send') {
    if (!campaign) {
      return notFound(`Campaign ${ctx.segments[1]} not found.`);
    }
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return badRequest('Only a draft or scheduled campaign can be sent.');
    }
    campaign.status = 'active';
    campaign.sentCount = campaign.audienceSize;
    return ok(campaign);
  }

  // POST /campaigns/:id/cancel
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'cancel') {
    if (!campaign) {
      return notFound(`Campaign ${ctx.segments[1]} not found.`);
    }
    if (campaign.status === 'completed') {
      return badRequest('A completed campaign cannot be cancelled.');
    }
    campaign.status = 'cancelled';
    return ok(campaign);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return campaign ? ok(campaign) : notFound(`Campaign ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.campaigns];
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((c) => c.status === status);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (c) => c.name.toLowerCase().includes(searchKey) || c.subject.toLowerCase().includes(searchKey),
      );
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
