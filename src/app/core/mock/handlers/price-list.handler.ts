import { MockHandler, ok } from '../mock-types';

export const handlePriceList: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'price-list' || ctx.method !== 'GET' || ctx.segments.length !== 1) {
    return undefined;
  }

  let items = [...ctx.store.priceList];
  const trade = ctx.query.get('trade');
  if (trade) {
    items = items.filter((item) => item.trade === trade);
  }
  const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
  if (searchKey) {
    items = items.filter(
      (item) =>
        item.serviceName.toLowerCase().includes(searchKey) ||
        item.code.toLowerCase().includes(searchKey),
    );
  }
  items.sort((a, b) => a.code.localeCompare(b.code));

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
