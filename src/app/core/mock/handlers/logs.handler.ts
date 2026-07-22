import { MockHandler, ok } from '../mock-types';

export const handleLogs: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'logs' || ctx.method !== 'GET' || ctx.segments.length !== 1) {
    return undefined;
  }

  let items = [...ctx.store.deliveryLogs];
  const channel = ctx.query.get('channel');
  if (channel) {
    items = items.filter((log) => log.channel === channel);
  }
  const status = ctx.query.get('status');
  if (status) {
    items = items.filter((log) => log.status === status);
  }
  const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
  if (searchKey) {
    items = items.filter(
      (log) =>
        log.recipient.toLowerCase().includes(searchKey) ||
        log.subject.toLowerCase().includes(searchKey),
    );
  }

  // Newest first — the operator is triaging recent delivery failures.
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
};
