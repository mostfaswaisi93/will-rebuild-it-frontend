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

  it('ignores routes outside /auth', () => {
    expect(handleAuth(makeContext(store, { method: 'GET', path: 'projects' }))).toBeUndefined();
  });
});
