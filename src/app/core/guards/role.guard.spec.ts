import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { User, UserRole } from '@core/models';
import { SessionStore } from '../session/session-store.service';
import { roleGuard } from './role.guard';

const STORAGE_KEY = 'wri-session';

const userWithRole = (role: UserRole): User => ({
  id: `u-${role}`,
  role,
  firstName: 'Test',
  lastName: 'User',
  email: `${role}@example.com`,
  phone: '+970000000',
  createdAt: '2026-01-01T00:00:00.000Z',
});

/** `roleGuard` ignores both arguments; it only reads the session role. */
const emptyRoute = {} as ActivatedRouteSnapshot;
const emptyState = {} as RouterStateSnapshot;

describe('roleGuard', () => {
  let router: Router;
  let session: SessionStore;

  const runGuard = (allowed: UserRole[]) =>
    TestBed.runInInjectionContext(() => roleGuard(allowed)(emptyRoute, emptyState));

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('lets a user through when their role is in the allowed list', () => {
    session.setSession({ token: 'tok', user: userWithRole('donor') });

    expect(runGuard(['donor'])).toBeTrue();
  });

  it('lets a user through when the allowed list names several roles', () => {
    session.setSession({ token: 'tok', user: userWithRole('team') });

    expect(runGuard(['beneficiary', 'team'])).toBeTrue();
  });

  it('sends a disallowed beneficiary back to the beneficiary dashboard', () => {
    session.setSession({ token: 'tok', user: userWithRole('beneficiary') });

    const result = runGuard(['donor']);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/app/dashboard');
  });

  it('sends a disallowed donor back to the donations page', () => {
    session.setSession({ token: 'tok', user: userWithRole('donor') });

    const result = runGuard(['beneficiary']);

    expect(router.serializeUrl(result as UrlTree)).toBe('/app/donations');
  });

  it('sends a disallowed team member back to the team dashboard', () => {
    session.setSession({ token: 'tok', user: userWithRole('team') });

    const result = runGuard(['donor']);

    expect(router.serializeUrl(result as UrlTree)).toBe('/app/team-dashboard');
  });

  it('sends a visitor with no session to the fallback dashboard', () => {
    const result = runGuard(['donor']);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/app/dashboard');
  });

  it('redirects everyone when the allowed list is empty', () => {
    session.setSession({ token: 'tok', user: userWithRole('team') });

    expect(router.serializeUrl(runGuard([]) as UrlTree)).toBe('/app/team-dashboard');
  });
});
