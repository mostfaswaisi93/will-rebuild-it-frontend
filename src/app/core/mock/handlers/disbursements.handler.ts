import { DisbursementStatus, Payout } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

/** How a payout can move. Settled and failed are terminal. */
const TRANSITIONS: Record<DisbursementStatus, DisbursementStatus[]> = {
  pending: ['authorised', 'failed'],
  authorised: ['sent', 'failed'],
  sent: ['settled', 'failed'],
  settled: [],
  failed: [],
};

const IN_FLIGHT: DisbursementStatus[] = ['pending', 'authorised', 'sent'];

function summarise(payouts: Payout[]) {
  const inFlight = payouts.filter((payout) => IN_FLIGHT.includes(payout.status));
  return {
    inFlightCount: inFlight.length,
    inFlightAmount: inFlight.reduce((sum, payout) => sum + payout.amount, 0),
    settledAmount: payouts
      .filter((payout) => payout.status === 'settled')
      .reduce((sum, payout) => sum + payout.amount, 0),
    failedCount: payouts.filter((payout) => payout.status === 'failed').length,
  };
}

export const handleDisbursements: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'disbursements') {
    return undefined;
  }

  const payout = ctx.segments[1]
    ? ctx.store.payouts.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /disbursements/:id/transition
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'transition') {
    if (!payout) {
      return notFound(`Disbursement ${ctx.segments[1]} not found.`);
    }
    const { status, reference } = (ctx.body ?? {}) as {
      status?: DisbursementStatus;
      reference?: string;
    };
    if (!status || !TRANSITIONS[payout.status].includes(status)) {
      return badRequest(`Cannot move a ${payout.status} payout to ${status}.`);
    }
    payout.status = status;
    if (reference?.trim()) {
      payout.reference = reference.trim();
    }
    if (status === 'settled') {
      payout.settledAt = new Date().toISOString();
    }
    return ok(payout);
  }

  // GET /disbursements/:id
  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return payout ? ok(payout) : notFound(`Disbursement ${ctx.segments[1]} not found.`);
  }

  // GET /disbursements
  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.payouts];
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((p) => p.status === status);
    }
    const method = ctx.query.get('method');
    if (method) {
      items = items.filter((p) => p.method === method);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (p) =>
          p.payoutNumber.toLowerCase().includes(searchKey) ||
          p.teamName.toLowerCase().includes(searchKey) ||
          (p.statementNumber?.toLowerCase().includes(searchKey) ?? false),
      );
    }

    // Summary over the filtered set, so the cards match the table.
    const summary = summarise(items);
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
