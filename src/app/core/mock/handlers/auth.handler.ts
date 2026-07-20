import { User, UserRole } from '@core/models';
import { MockHandler, badRequest, ok, unauthorized } from '../mock-types';

interface CheckEmailBody {
  email?: string;
}

interface LookupBody {
  email?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
  role?: UserRole;
}

/** Shape the sign-in page consumes — see `AccountRoleDto`. */
function toAccountRole(user: User) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status ?? 'active',
    registrationComplete: user.registrationComplete ?? true,
  };
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

  /**
   * One email can front several role accounts, so this resolves against the
   * user list rather than the credential map (which is keyed one-per-email).
   * An unknown address returns an empty list, not an error.
   */
  if (ctx.method === 'POST' && ctx.segments[1] === 'lookup') {
    const { email } = (ctx.body ?? {}) as LookupBody;
    if (!email) {
      return badRequest('Email is required.');
    }
    const normalised = email.toLowerCase();
    const accounts = ctx.store.users
      .filter((user) => user.email.toLowerCase() === normalised)
      .map(toAccountRole);
    return ok({ accounts });
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'login') {
    const { email, password, role } = (ctx.body ?? {}) as LoginBody;
    const credential = email ? ctx.store.credentials[email.toLowerCase()] : undefined;

    if (!credential || credential.password !== password) {
      return unauthorized('Incorrect email or password.');
    }

    const normalised = (email ?? '').toLowerCase();
    const matches = ctx.store.users.filter((user) => user.email.toLowerCase() === normalised);

    // With several accounts behind one address the caller must say which it
    // wants; without a role we fall back to the credential's own account.
    const user = role
      ? matches.find((candidate) => candidate.role === role)
      : (ctx.store.users.find((candidate) => candidate.id === credential.userId) ?? matches[0]);

    if (!user) {
      return unauthorized();
    }

    // Blocked accounts must not mint a token even with the right password —
    // the sign-in form disables submit, but the API is the real gate.
    if ((user.status ?? 'active') === 'suspended') {
      return unauthorized('This account is suspended.');
    }
    if (user.registrationComplete === false) {
      return unauthorized('Registration is not complete for this account.');
    }

    return ok({ token: `mock-token-${user.id}-${Date.now()}`, user });
  }

  return undefined;
};
