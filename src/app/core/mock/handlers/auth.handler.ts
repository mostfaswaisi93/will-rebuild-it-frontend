import { User, UserRole } from '@core/models';
import { MockHandler, badRequest, conflict, created, ok, unauthorized } from '../mock-types';

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

interface RegisterBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

interface OnboardingBody {
  email?: string;
  businessName?: string;
  nationalId?: string;
  acceptedTerms?: boolean;
}

interface SendCodeBody {
  email?: string;
  channel?: 'email' | 'sms';
  role?: UserRole;
}

interface VerifyCodeBody {
  challengeId?: string;
  code?: string;
}

interface ResetPasswordBody {
  resetToken?: string;
  password?: string;
}

interface ActivateBody {
  resetToken?: string;
  password?: string;
  acceptedTerms?: boolean;
  subscribeToEmails?: boolean;
}

/**
 * Fixed demo code. A real backend would generate and deliver one; here there is
 * no inbox or SMS gateway to deliver to, so the flow is testable with a known
 * value. It still lives only in the store — never in a response body.
 */
const DEMO_CODE = '123456';

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}-${Date.now()}`;
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

  if (ctx.method === 'POST' && ctx.segments[1] === 'register') {
    const { firstName, lastName, email, phone, password } = (ctx.body ?? {}) as RegisterBody;
    if (!firstName || !lastName || !email || !phone || !password) {
      return badRequest('All fields are required.');
    }

    const normalised = email.toLowerCase();
    const clash = ctx.store.users.some(
      (user) => user.email.toLowerCase() === normalised && user.role === 'contractor',
    );
    if (clash) {
      return conflict('An account already exists for this email.');
    }

    const id = nextId('user-contractor');
    ctx.store.users.push({
      id,
      role: 'contractor',
      firstName,
      lastName,
      email,
      phone,
      createdAt: new Date().toISOString(),
      // Registered but not yet onboarded — sign-in blocks this until the
      // contractor wizard completes, exactly as the legacy flags did.
      status: 'inactive',
      registrationComplete: false,
    });
    // Only set when the address is new to the credential map: an existing
    // beneficiary re-registering as a contractor keeps their current password.
    ctx.store.credentials[normalised] ??= { password, userId: id };

    return created({ userId: id });
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'contractor-onboarding') {
    const { email, businessName, nationalId, acceptedTerms } = (ctx.body ?? {}) as OnboardingBody;

    if (!email || !businessName || !nationalId) {
      return badRequest('Business and identity details are required.');
    }
    // Enforced server-side as well: the checkbox is a UI affordance, the record
    // of consent is what matters.
    if (acceptedTerms !== true) {
      return badRequest('The declaration must be accepted.');
    }

    const normalised = email.toLowerCase();
    const user = ctx.store.users.find(
      (candidate) => candidate.email.toLowerCase() === normalised && candidate.role === 'contractor',
    );
    if (!user) {
      return unauthorized('No contractor account for this email.');
    }

    // Completing onboarding is what lifts the block sign-in enforces.
    user.registrationComplete = true;
    user.status = 'active';

    return ok({ token: `mock-token-${user.id}-${Date.now()}`, user });
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'verification-code' && !ctx.segments[2]) {
    const { email, channel, role } = (ctx.body ?? {}) as SendCodeBody;
    if (!email || !channel || !role) {
      return badRequest('Email, channel and role are required.');
    }

    const normalised = email.toLowerCase();
    const account = ctx.store.users.find(
      (user) => user.email.toLowerCase() === normalised && user.role === role,
    );
    if (!account) {
      return badRequest('No such account.');
    }
    if (channel === 'sms' && !account.phone) {
      return badRequest('This account has no phone number on file.');
    }

    const challengeId = nextId('challenge');
    ctx.store.verificationChallenges.set(challengeId, {
      email: normalised,
      role,
      code: DEMO_CODE,
      channel,
    });
    // Only the id crosses the wire; the code is delivered out of band.
    return ok({ challengeId });
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'verification-code' && ctx.segments[2] === 'verify') {
    const { challengeId, code } = (ctx.body ?? {}) as VerifyCodeBody;
    const challenge = challengeId ? ctx.store.verificationChallenges.get(challengeId) : undefined;

    if (!challenge || challenge.code !== code) {
      return unauthorized('That code is not correct.');
    }

    // Single use: burn the challenge so a captured code can't be replayed.
    ctx.store.verificationChallenges.delete(challengeId as string);

    const resetToken = nextId('reset');
    ctx.store.resetTokens.set(resetToken, { email: challenge.email, role: challenge.role });
    return ok({ resetToken });
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'reset-password') {
    const { resetToken, password } = (ctx.body ?? {}) as ResetPasswordBody;
    const grant = resetToken ? ctx.store.resetTokens.get(resetToken) : undefined;

    if (!grant || !password) {
      return unauthorized('This reset link has expired.');
    }
    ctx.store.resetTokens.delete(resetToken as string);

    const credential = ctx.store.credentials[grant.email];
    if (credential) {
      credential.password = password;
    }

    const user = ctx.store.users.find(
      (candidate) => candidate.email.toLowerCase() === grant.email && candidate.role === grant.role,
    );
    if (!user) {
      return unauthorized();
    }

    return ok({ token: `mock-token-${user.id}-${Date.now()}`, user });
  }

  if (ctx.method === 'POST' && ctx.segments[1] === 'activate') {
    const { resetToken, password, acceptedTerms } = (ctx.body ?? {}) as ActivateBody;
    const grant = resetToken ? ctx.store.resetTokens.get(resetToken) : undefined;

    if (!grant || !password) {
      return unauthorized('This activation link has expired.');
    }
    // Consent is enforced server-side too — a disabled submit button is not a
    // record that the terms were accepted.
    if (acceptedTerms !== true) {
      return badRequest('The terms must be accepted to activate an account.');
    }
    ctx.store.resetTokens.delete(resetToken as string);

    const credential = ctx.store.credentials[grant.email];
    if (credential) {
      credential.password = password;
    }

    const user = ctx.store.users.find(
      (candidate) => candidate.email.toLowerCase() === grant.email && candidate.role === grant.role,
    );
    if (!user) {
      return unauthorized();
    }

    // Activation is what clears the pending state that blocked sign-in.
    user.status = 'active';
    user.registrationComplete = true;

    return ok({ token: `mock-token-${user.id}-${Date.now()}`, user });
  }

  return undefined;
};
