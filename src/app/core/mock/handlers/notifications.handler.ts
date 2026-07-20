import { MockHandler, notFound, ok } from '../mock-types';

export const handleNotifications: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'notifications') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    return ok(ctx.store.notifications);
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
