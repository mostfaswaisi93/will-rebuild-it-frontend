import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AccountRoleDto } from '@core/api/dto/auth.dto';
import { PasswordResetFlow, ResetIntent } from './password-reset-flow.service';
import { passwordResetStepGuard } from './password-reset-step.guard';

const ACCOUNT: AccountRoleDto = {
  id: 'user-contractor-1',
  email: 'contractor@example.com',
  phone: '+970598334455',
  role: 'contractor',
  status: 'active',
  registrationComplete: true,
};

/** Minimal snapshot carrying only what the guard reads: `parent.data.intent`. */
function snapshotFor(intent: ResetIntent): ActivatedRouteSnapshot {
  return { parent: { data: { intent } } } as unknown as ActivatedRouteSnapshot;
}

describe('passwordResetStepGuard', () => {
  let flow: PasswordResetFlow;

  function run(step: 'method' | 'verify' | 'reset', intent: ResetIntent = 'reset') {
    return TestBed.runInInjectionContext(() =>
      passwordResetStepGuard(step)(snapshotFor(intent), {} as RouterStateSnapshot),
    );
  }

  /** The guard returns synchronously; narrow to the UrlTree it redirects with. */
  function urlOf(result: unknown): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), PasswordResetFlow],
    });
    flow = TestBed.inject(PasswordResetFlow);
  });

  it('blocks a step whose prerequisite is missing', () => {
    expect(run('method')).not.toBeTrue();
    expect(run('verify')).not.toBeTrue();
    expect(run('reset')).not.toBeTrue();
  });

  it('allows a step once its prerequisite is satisfied', () => {
    flow.setIdentity('contractor@example.com', ACCOUNT);
    expect(run('method')).toBeTrue();

    flow.setChallenge('email', 'challenge-1');
    expect(run('verify')).toBeTrue();

    flow.setResetToken('reset-1');
    expect(run('reset')).toBeTrue();
  });

  it('sends an unsatisfied step back to the furthest one reached', () => {
    flow.setIdentity('contractor@example.com', ACCOUNT);
    // Identity is done but no code sent, so the reset step belongs at 'method'.
    expect(urlOf(run('reset'))).toBe('/auth/forgot-password/method');

    flow.setChallenge('email', 'challenge-1');
    expect(urlOf(run('reset'))).toBe('/auth/forgot-password/verify');
  });

  it('redirects within the activation mount point, not the reset one', () => {
    // Regression: the guard used to hardcode /auth/forgot-password, dumping
    // anyone deep-linking into activation onto the wrong journey.
    expect(urlOf(run('verify', 'activate'))).toBe('/auth/activate');

    flow.setIdentity('contractor@example.com', ACCOUNT);
    expect(urlOf(run('reset', 'activate'))).toBe('/auth/activate/method');
  });

  it('defaults to the reset journey when no intent is on the route', () => {
    const noIntent = { parent: { data: {} } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      passwordResetStepGuard('verify')(noIntent, {} as RouterStateSnapshot),
    );
    expect(urlOf(result)).toBe('/auth/forgot-password');
  });
});
