import { BeneficiaryProfile } from '@core/models';
import { NotificationPreferences } from '../fixtures/profile.fixture';
import { MockHandler, ok } from '../mock-types';

export const handleProfile: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'profile') {
    return undefined;
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    return ok(ctx.store.beneficiaryProfile);
  }

  if (ctx.method === 'PUT' && ctx.segments.length === 1) {
    const body = (ctx.body ?? {}) as Partial<BeneficiaryProfile>;
    ctx.store.beneficiaryProfile = { ...ctx.store.beneficiaryProfile, ...body };
    return ok(ctx.store.beneficiaryProfile);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2 && ctx.segments[1] === 'notification-preferences') {
    return ok(ctx.store.notificationPreferences);
  }

  if (ctx.method === 'PUT' && ctx.segments.length === 2 && ctx.segments[1] === 'notification-preferences') {
    const body = (ctx.body ?? {}) as Partial<NotificationPreferences>;
    ctx.store.notificationPreferences = { ...ctx.store.notificationPreferences, ...body };
    return ok(ctx.store.notificationPreferences);
  }

  if (ctx.method === 'POST' && ctx.segments.length === 2 && ctx.segments[1] === 'change-password') {
    return ok({ changed: true });
  }

  return undefined;
};
