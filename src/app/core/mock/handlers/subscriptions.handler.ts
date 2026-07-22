import { Subscription } from '@core/models';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

function summarise(subscriptions: Subscription[]) {
  const active = subscriptions.filter((sub) => sub.status === 'active');
  return {
    activeCount: active.length,
    pastDueCount: subscriptions.filter((sub) => sub.status === 'pastDue').length,
    annualRevenue: active.reduce((sum, sub) => sum + sub.amount, 0),
  };
}

/** Adds a year to an ISO timestamp, preserving the day-of-year. */
function addYear(iso: string): string {
  const next = new Date(iso);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

export const handleSubscriptions: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'subscriptions') {
    return undefined;
  }

  const subscription = ctx.segments[1]
    ? ctx.store.subscriptions.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /subscriptions/:id/renew — record a payment and extend by a year
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'renew') {
    if (!subscription) {
      return notFound(`Subscription ${ctx.segments[1]} not found.`);
    }
    if (subscription.status === 'cancelled') {
      return badRequest('A cancelled subscription cannot be renewed.');
    }
    const now = new Date().toISOString();
    subscription.payments = [
      ...subscription.payments,
      {
        id: `sp-${Date.now()}`,
        amount: subscription.amount,
        currency: subscription.currency,
        paidAt: now,
        method: 'bankTransfer',
        refunded: false,
      },
    ];
    subscription.renewsAt = addYear(subscription.renewsAt);
    subscription.status = 'active';
    return ok(subscription);
  }

  // POST /subscriptions/:id/cancel
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'cancel') {
    if (!subscription) {
      return notFound(`Subscription ${ctx.segments[1]} not found.`);
    }
    if (subscription.status === 'cancelled') {
      return badRequest('Subscription is already cancelled.');
    }
    subscription.status = 'cancelled';
    return ok(subscription);
  }

  // POST /subscriptions/:id/payments/:paymentId/refund
  if (
    ctx.method === 'POST' &&
    ctx.segments.length === 5 &&
    ctx.segments[2] === 'payments' &&
    ctx.segments[4] === 'refund'
  ) {
    if (!subscription) {
      return notFound(`Subscription ${ctx.segments[1]} not found.`);
    }
    const payment = subscription.payments.find((candidate) => candidate.id === ctx.segments[3]);
    if (!payment) {
      return notFound(`Payment ${ctx.segments[3]} not found.`);
    }
    if (payment.refunded) {
      return badRequest('Payment has already been refunded.');
    }
    payment.refunded = true;
    return ok(subscription);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return subscription ? ok(subscription) : notFound(`Subscription ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.subscriptions];
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((sub) => sub.status === status);
    }
    const plan = ctx.query.get('plan');
    if (plan) {
      items = items.filter((sub) => sub.plan === plan);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (sub) =>
          sub.teamName.toLowerCase().includes(searchKey) ||
          sub.subscriptionNumber.toLowerCase().includes(searchKey),
      );
    }

    const summary = summarise(items);
    items.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

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
