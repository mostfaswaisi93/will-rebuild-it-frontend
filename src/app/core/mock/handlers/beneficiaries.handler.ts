import { BENEFICIARY_STATUSES, BeneficiaryStatus } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

export const handleBeneficiaries: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'beneficiaries') {
    return undefined;
  }

  const beneficiary = ctx.segments[1]
    ? ctx.store.beneficiaries.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /beneficiaries/:id/status — eligibility decision
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'status') {
    if (!beneficiary) {
      return notFound(`Beneficiary ${ctx.segments[1]} not found.`);
    }
    const { status } = (ctx.body ?? {}) as { status?: BeneficiaryStatus };
    if (!status || !BENEFICIARY_STATUSES.includes(status)) {
      return badRequest('A valid status is required.');
    }
    beneficiary.status = status;
    return ok(beneficiary);
  }

  // GET /beneficiaries/:id — case file with the household's requests
  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    if (!beneficiary) {
      return notFound(`Beneficiary ${ctx.segments[1]} not found.`);
    }
    // Requests are matched by contact phone — the case file has no FK on the
    // request, so this gathers by the shared contact number.
    const requests = ctx.store.requests.filter(
      (request) => request.contactPhone === beneficiary.phone,
    );
    return ok({ beneficiary, requests });
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.beneficiaries];

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((b) => b.status === status);
    }
    const governorate = ctx.query.get('governorate');
    if (governorate) {
      items = items.filter((b) => b.address.governorate === governorate);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (b) =>
          b.name.toLowerCase().includes(searchKey) ||
          b.nationalId.includes(searchKey) ||
          b.phone.includes(searchKey),
      );
    }

    items.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));

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
