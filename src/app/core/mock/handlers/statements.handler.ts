import { Statement } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

function summarise(statements: Statement[]) {
  const approvedUnpaid = statements.filter(
    (statement) =>
      (statement.status === 'approved' || statement.status === 'partiallyPaid') &&
      statement.paidAmount < statement.approvedAmount,
  );
  return {
    total: statements.length,
    awaitingReview: statements.filter(
      (statement) => statement.status === 'submitted' || statement.status === 'underReview',
    ).length,
    approvedUnpaid: approvedUnpaid.length,
    approvedUnpaidAmount: approvedUnpaid.reduce(
      (sum, statement) => sum + (statement.approvedAmount - statement.paidAmount),
      0,
    ),
    paidAmount: statements.reduce((sum, statement) => sum + statement.paidAmount, 0),
  };
}

export const handleStatements: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'statements') {
    return undefined;
  }

  const statement = ctx.segments[1]
    ? ctx.store.statements.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /statements/:id/<action>
  if (ctx.method === 'POST' && ctx.segments.length === 3) {
    if (!statement) {
      return notFound(`Statement ${ctx.segments[1]} not found.`);
    }
    const action = ctx.segments[2];

    if (action === 'review') {
      if (statement.status !== 'submitted') {
        return badRequest('Only a submitted statement can be moved into review.');
      }
      statement.status = 'underReview';
      return ok(statement);
    }

    if (action === 'approve') {
      if (statement.status !== 'submitted' && statement.status !== 'underReview') {
        return badRequest('Only a statement under review can be approved.');
      }
      const { approvedAmount } = (ctx.body ?? {}) as { approvedAmount?: number };
      const amount = approvedAmount ?? statement.netAmount;
      if (amount < 0 || amount > statement.netAmount) {
        return badRequest('The approved amount must be between zero and the net claimed.');
      }
      statement.status = 'approved';
      statement.approvedAmount = amount;
      statement.reviewedAt = new Date().toISOString();
      statement.rejectionReason = undefined;
      return ok(statement);
    }

    if (action === 'reject') {
      if (statement.status !== 'submitted' && statement.status !== 'underReview') {
        return badRequest('Only a statement under review can be rejected.');
      }
      const { rejectionReason } = (ctx.body ?? {}) as { rejectionReason?: string };
      if (!rejectionReason?.trim()) {
        return badRequest('A rejection reason is required.');
      }
      statement.status = 'rejected';
      statement.rejectionReason = rejectionReason.trim();
      statement.reviewedAt = new Date().toISOString();
      return ok(statement);
    }

    if (action === 'pay') {
      if (statement.status !== 'approved' && statement.status !== 'partiallyPaid') {
        return badRequest('Only an approved statement can be paid.');
      }
      const { amount } = (ctx.body ?? {}) as { amount?: number };
      if (!amount || amount <= 0) {
        return badRequest('A positive payment amount is required.');
      }
      const remaining = statement.approvedAmount - statement.paidAmount;
      if (amount > remaining) {
        return badRequest('The payment exceeds the outstanding approved amount.');
      }
      statement.paidAmount += amount;
      statement.status = statement.paidAmount >= statement.approvedAmount ? 'paid' : 'partiallyPaid';
      return ok(statement);
    }

    return badRequest(`Unknown action "${action}".`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return statement ? ok(statement) : notFound(`Statement ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.statements];

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((s) => s.status === status);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (s) =>
          s.statementNumber.toLowerCase().includes(searchKey) ||
          s.projectTitle.toLowerCase().includes(searchKey) ||
          s.workOrderNumber.toLowerCase().includes(searchKey),
      );
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const summary = summarise(items);
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
