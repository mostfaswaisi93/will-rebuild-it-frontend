import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { User } from '@core/models';
import { SessionStore } from '../session/session-store.service';
import { authGuard } from './auth.guard';

const STORAGE_KEY = 'grp-session';

const BENEFICIARY: User = {
  id: 'u-1',
  role: 'beneficiary',
  firstName: 'Layla',
  lastName: 'Haddad',
  email: 'layla@example.com',
  phone: '+970000000',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Minimal snapshots — `authGuard` only reads `state.url`. */
const emptyRoute = {} as ActivatedRouteSnapshot;
const stateFor = (url: string) => ({ url }) as RouterStateSnapshot;

describe('authGuard', () => {
  let router: Router;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('lets a signed-in visitor through to the requested page', () => {
    session.setSession({ token: 'tok-abc', user: BENEFICIARY });

    const result = TestBed.runInInjectionContext(() =>
      authGuard(emptyRoute, stateFor('/app/dashboard')),
    );

    expect(result).toBeTrue();
  });

  it('redirects an unauthenticated visitor to the email-check page', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(emptyRoute, stateFor('/app/dashboard')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/pub/email-check/request?returnUrl=%2Fapp%2Fdashboard',
    );
  });

  it('preserves the originally requested url as the returnUrl query param', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(emptyRoute, stateFor('/app/requests/req-9/estimate')),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/pub/email-check/request?returnUrl=%2Fapp%2Frequests%2Freq-9%2Festimate',
    );
  });

  it('redirects again once the session has been cleared', () => {
    session.setSession({ token: 'tok-abc', user: BENEFICIARY });
    session.clearSession();

    const result = TestBed.runInInjectionContext(() =>
      authGuard(emptyRoute, stateFor('/app/profile')),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/pub/email-check/request?returnUrl=%2Fapp%2Fprofile',
    );
  });
});
