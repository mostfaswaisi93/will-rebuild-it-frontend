import { AppNotification } from '@core/models';
import { MockHandler, badRequest, created, notFound, ok } from '../mock-types';

interface BroadcastBody {
  title?: string;
  body?: string;
  linkUrl?: string;
}

export const handleNotifications: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'notifications') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    return ok(ctx.store.notifications);
  }

  // POST /notifications — broadcast an announcement. A real backend would fan
  // this out per recipient; the mock models the signed-in user's copy.
  if (ctx.method === 'POST' && ctx.segments.length === 1) {
    const payload = (ctx.body ?? {}) as BroadcastBody;
    const title = payload.title?.trim();
    const body = payload.body?.trim();
    if (!title || !body) {
      return badRequest('A title and body are required.');
    }
    const announcement: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      body,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: payload.linkUrl?.trim() || undefined,
    };
    ctx.store.notifications.unshift(announcement);
    return created(announcement);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 2 && ctx.segments[1] === 'read-all') {
    ctx.store.notifications.forEach((notification) => (notification.isRead = true));
    return ok(ctx.store.notifications);
  }

  const notification = ctx.store.notifications.find((candidate) => candidate.id === ctx.segments[1]);

  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'read') {
    if (!notification) {
      return notFound(`Notification ${ctx.segments[1]} not found.`);
    }
    notification.isRead = true;
    return ok(notification);
  }

  if (ctx.method === 'DELETE' && ctx.segments.length === 2) {
    const index = ctx.store.notifications.findIndex((candidate) => candidate.id === ctx.segments[1]);
    if (index === -1) {
      return notFound(`Notification ${ctx.segments[1]} not found.`);
    }
    ctx.store.notifications.splice(index, 1);
    return ok({ id: ctx.segments[1] });
  }

  return undefined;
};
