import { User } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleAuth } from './auth.handler';

interface ContextOverrides {
  method?: string;
  path: string;
  body?: unknown;
}

function makeContext(store: MockStore, { method = 'POST', path, body = null }: ContextOverrides): MockRequestContext {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return { method, path, segments, query: new URLSearchParams(), body, store };
}

function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler did not claim the route').toBeDefined();
  return result as MockResult;
}

interface AccountRole {
  id: string;
  role: string;
  status: string;
  registrationComplete: boolean;
}

describe('auth handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  describe('POST /auth/lookup', () => {
    it('returns every role account behind one address', () => {
      const result = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/lookup', body: { email: 'contractor@example.com' } })),
      );

      expect(result.status).toBe(200);
      const { accounts } = result.body as { accounts: AccountRole[] };
      // This address deliberately fronts two accounts — it is what the sign-in
      // role picker exists for.
      expect(accounts.length).toBe(2);
      expect(accounts.map((account) => account.role).sort()).toEqual(['beneficiary', 'contractor']);
    });

    it('matches case-insensitively', () => {
      const result = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/lookup', body: { email: 'ADMIN@Example.com' } })),
      );
      const { accounts } = result.body as { accounts: AccountRole[] };
      expect(accounts.length).toBe(1);
      expect(accounts[0]?.role).toBe('admin');
    });

    it('returns an empty list rather than an error for an unknown address', () => {
      // Sign-in distinguishes "no such user" from "lookup failed"; an error here
      // would collapse the two and show a network blip as a missing account.
      const result = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/lookup', body: { email: 'nobody@example.com' } })),
      );
      expect(result.status).toBe(200);
      expect((result.body as { accounts: AccountRole[] }).accounts).toEqual([]);
    });

    it('surfaces the blocking states sign-in needs', () => {
      const suspended = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/lookup', body: { email: 'suspended@example.com' } })),
      ).body as { accounts: AccountRole[] };
      expect(suspended.accounts[0]?.status).toBe('suspended');

      const pending = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/lookup', body: { email: 'pending@example.com' } })),
      ).body as { accounts: AccountRole[] };
      expect(pending.accounts[0]?.registrationComplete).toBeFalse();
    });
  });

  describe('POST /auth/login', () => {
    it('signs the requested role in when one address holds several', () => {
      const result = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/login',
            body: { email: 'contractor@example.com', password: 'Demo@1234', role: 'beneficiary' },
          }),
        ),
      );

      expect(result.status).toBe(200);
      expect((result.body as { user: User }).user.role).toBe('beneficiary');
    });

    it('rejects a wrong password', () => {
      const result = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/login',
            body: { email: 'admin@example.com', password: 'wrong', role: 'admin' },
          }),
        ),
      );
      expect(result.status).toBe(401);
    });

    it('refuses a suspended account even with the correct password', () => {
      // The form disables submit for this case, but the API is the real gate —
      // a client-side-only check would be no check at all.
      const result = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/login',
            body: { email: 'suspended@example.com', password: 'Demo@1234', role: 'contractor' },
          }),
        ),
      );
      expect(result.status).toBe(401);
    });

    it('refuses an account whose registration is incomplete', () => {
      const result = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/login',
            body: { email: 'pending@example.com', password: 'Demo@1234', role: 'contractor' },
          }),
        ),
      );
      expect(result.status).toBe(401);
    });
  });

  describe('POST /auth/register', () => {
    const NEW_ACCOUNT = {
      firstName: 'Kareem',
      lastName: 'Abu Odeh',
      email: 'kareem@example.com',
      phone: '+970591112233',
      password: 'Newpass1!',
    };

    it('creates a contractor account in the pending state', () => {
      const result = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/register', body: NEW_ACCOUNT })),
      );
      expect(result.status).toBe(201);

      const created = store.users.find((user) => user.email === NEW_ACCOUNT.email);
      expect(created?.role).toBe('contractor');
      // Pending until the onboarding wizard finishes — sign-in must refuse it.
      expect(created?.registrationComplete).toBeFalse();

      const login = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/login',
            body: { email: NEW_ACCOUNT.email, password: NEW_ACCOUNT.password, role: 'contractor' },
          }),
        ),
      );
      expect(login.status).toBe(401);
    });

    it('rejects a duplicate contractor registration', () => {
      handleAuth(makeContext(store, { path: 'auth/register', body: NEW_ACCOUNT }));
      const again = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/register', body: NEW_ACCOUNT })),
      );
      expect(again.status).toBe(409);
    });

    it('lets an existing beneficiary add a contractor account', () => {
      // Same person, second role — the lookup/role-picker case.
      const result = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/register',
            body: { ...NEW_ACCOUNT, email: 'youssef@example.com' },
          }),
        ),
      );
      expect(result.status).toBe(201);

      const lookup = expectHandled(
        handleAuth(makeContext(store, { path: 'auth/lookup', body: { email: 'youssef@example.com' } })),
      ).body as { accounts: AccountRole[] };
      expect(lookup.accounts.map((a) => a.role).sort()).toEqual(['beneficiary', 'contractor']);
    });

    it('does not overwrite an existing password when adding a role', () => {
      // The credential map is keyed by email; clobbering it would silently
      // change the password of the account the person already had.
      handleAuth(
        makeContext(store, {
          path: 'auth/register',
          body: { ...NEW_ACCOUNT, email: 'youssef@example.com', password: 'Different1!' },
        }),
      );
      expect(store.credentials['youssef@example.com']?.password).toBe('Demo@1234');
    });

    it('rejects an incomplete submission', () => {
      const result = expectHandled(
        handleAuth(
          makeContext(store, { path: 'auth/register', body: { email: 'x@example.com' } }),
        ),
      );
      expect(result.status).toBe(400);
    });
  });

  describe('password reset / activation', () => {
    const DEMO_CODE = '123456';

    function sendCode(email: string, role: string, channel: 'email' | 'sms' = 'email'): MockResult {
      return expectHandled(
        handleAuth(makeContext(store, { path: 'auth/verification-code', body: { email, channel, role } })),
      );
    }

    function verify(challengeId: string, code: string): MockResult {
      return expectHandled(
        handleAuth(
          makeContext(store, { path: 'auth/verification-code/verify', body: { challengeId, code } }),
        ),
      );
    }

    it('never returns the code itself', () => {
      // The legacy API handed the expected value back in the body, so the
      // comparison the page performed was decorative.
      const result = sendCode('admin@example.com', 'admin');
      expect(result.status).toBe(200);
      expect(JSON.stringify(result.body)).not.toContain(DEMO_CODE);
      expect((result.body as { challengeId: string }).challengeId).toBeTruthy();
    });

    it('refuses SMS for an account with no phone number', () => {
      store.users.push({
        id: 'user-nophone',
        role: 'admin',
        firstName: 'No',
        lastName: 'Phone',
        email: 'nophone@example.com',
        phone: '',
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      const result = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/verification-code',
            body: { email: 'nophone@example.com', channel: 'sms', role: 'admin' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('rejects a wrong code and accepts the right one', () => {
      const { challengeId } = sendCode('admin@example.com', 'admin').body as { challengeId: string };

      expect(verify(challengeId, '000000').status).toBe(401);

      const good = verify(challengeId, DEMO_CODE);
      expect(good.status).toBe(200);
      expect((good.body as { resetToken: string }).resetToken).toBeTruthy();
    });

    it('burns a challenge after one successful use', () => {
      const { challengeId } = sendCode('admin@example.com', 'admin').body as { challengeId: string };
      verify(challengeId, DEMO_CODE);

      // Replaying a captured code must not mint a second reset token.
      expect(verify(challengeId, DEMO_CODE).status).toBe(401);
    });

    it('changes the password and lets the new one sign in', () => {
      const { challengeId } = sendCode('admin@example.com', 'admin').body as { challengeId: string };
      const { resetToken } = verify(challengeId, DEMO_CODE).body as { resetToken: string };

      const reset = expectHandled(
        handleAuth(
          makeContext(store, { path: 'auth/reset-password', body: { resetToken, password: 'NewPass1!' } }),
        ),
      );
      expect(reset.status).toBe(200);

      const login = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/login',
            body: { email: 'admin@example.com', password: 'NewPass1!', role: 'admin' },
          }),
        ),
      );
      expect(login.status).toBe(200);
    });

    it('burns the reset token after use', () => {
      const { challengeId } = sendCode('admin@example.com', 'admin').body as { challengeId: string };
      const { resetToken } = verify(challengeId, DEMO_CODE).body as { resetToken: string };

      handleAuth(makeContext(store, { path: 'auth/reset-password', body: { resetToken, password: 'NewPass1!' } }));
      const replay = expectHandled(
        handleAuth(
          makeContext(store, { path: 'auth/reset-password', body: { resetToken, password: 'Other1!x' } }),
        ),
      );
      expect(replay.status).toBe(401);
    });

    it('activation clears the state that blocked sign-in', () => {
      const { challengeId } = sendCode('pending@example.com', 'contractor').body as {
        challengeId: string;
      };
      const { resetToken } = verify(challengeId, DEMO_CODE).body as { resetToken: string };

      const activated = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/activate',
            body: { resetToken, password: 'NewPass1!', acceptedTerms: true, subscribeToEmails: true },
          }),
        ),
      );
      expect(activated.status).toBe(200);

      const user = (activated.body as { user: User }).user;
      expect(user.status).toBe('active');
      expect(user.registrationComplete).toBeTrue();

      // The same account was rejected at sign-in before activation.
      const login = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/login',
            body: { email: 'pending@example.com', password: 'NewPass1!', role: 'contractor' },
          }),
        ),
      );
      expect(login.status).toBe(200);
    });

    it('refuses to activate without consent', () => {
      const { challengeId } = sendCode('pending@example.com', 'contractor').body as {
        challengeId: string;
      };
      const { resetToken } = verify(challengeId, DEMO_CODE).body as { resetToken: string };

      const result = expectHandled(
        handleAuth(
          makeContext(store, {
            path: 'auth/activate',
            body: { resetToken, password: 'NewPass1!', acceptedTerms: false, subscribeToEmails: false },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });
  });

  it('ignores routes outside /auth', () => {
    expect(handleAuth(makeContext(store, { method: 'GET', path: 'projects' }))).toBeUndefined();
  });
});
