import { MockHandler, badRequest, ok, unauthorized } from '../mock-types';

interface CheckEmailBody {
  email?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

export const handleAuth: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'auth') {
    return undefined;
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'check-email') {
    const { email } = (ctx.body ?? {}) as CheckEmailBody;
    if (!email) {
      return badRequest('Email is required.');
    }
    const exists = email.toLowerCase() in ctx.store.credentials;
    return ok({ exists });
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'login') {
    const { email, password } = (ctx.body ?? {}) as LoginBody;
    const credential = email ? ctx.store.credentials[email.toLowerCase()] : undefined;

    if (!credential || credential.password !== password) {
      return unauthorized('Incorrect email or password.');
    }

    const user = ctx.store.users.find((candidate) => candidate.id === credential.userId);
    if (!user) {
      return unauthorized();
    }

    return ok({ token: `mock-token-${user.id}-${Date.now()}`, user });
  }

  return undefined;
};
