import { SupportTicket } from '@core/models';
import { MockHandler, created, notFound, ok, paginate } from '../mock-types';

interface CreateSupportBody {
  projectId?: string;
  projectTitle?: string;
  subject?: string;
  description?: string;
}

interface ReplyBody {
  body?: string;
}

export const handleSupport: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'support') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items: SupportTicket[] = ctx.store.supportTickets;
    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((ticket) => ticket.status === status);
    }
    return ok(paginate(items, ctx));
  }

  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const body = (ctx.body ?? {}) as CreateSupportBody;
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: `support-${Date.now()}`,
      ticketNumber: `SUP-2026-${String(ctx.store.supportTickets.length + 20).padStart(5, '0')}`,
      projectId: body.projectId,
      projectTitle: body.projectTitle,
      subject: body.subject ?? '',
      description: body.description ?? '',
      status: 'open',
      messages: [
        {
          id: `msg-${Date.now()}`,
          author: 'beneficiary',
          body: body.description ?? '',
          createdAt: now,
        },
      ],
      createdAt: now,
    };
    ctx.store.supportTickets.unshift(ticket);
    return created(ticket);
  }

  const ticket = ctx.store.supportTickets.find((candidate) => candidate.id === ctx.segments[1]);

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return ticket ? ok(ticket) : notFound(`Ticket ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'messages') {
    if (!ticket) {
      return notFound(`Ticket ${ctx.segments[1]} not found.`);
    }
    const body = (ctx.body ?? {}) as ReplyBody;
    ticket.messages.push({
      id: `msg-${Date.now()}`,
      author: 'beneficiary',
      body: body.body ?? '',
      createdAt: new Date().toISOString(),
    });
    return created(ticket);
  }

  return undefined;
};
