import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { OnboardingFlow } from './onboarding-flow.service';
import { onboardingStepGuard } from './onboarding-step.guard';

const BUSINESS = {
  businessName: 'شركة البناء المتحد',
  businessType: 'limitedCompany' as const,
  registrationNumber: '5620001',
  trades: ['generalConstruction' as const],
};
const IDENTITY = { nationalId: '999999998', dateOfBirth: '1990-05-10' };
const LOCATION = {
  governorate: 'gazaCity' as const,
  area: 'الرمال',
  streetAddress: 'شارع عمر المختار',
  contactPhone: '+970598334455',
  latitude: null,
  longitude: null,
};

describe('OnboardingFlow', () => {
  let flow: OnboardingFlow;

  beforeEach(() => {
    flow = new OnboardingFlow();
  });

  it('unlocks steps only in order', () => {
    expect(flow.hasBusiness()).toBeFalse();
    expect(flow.hasIdentity()).toBeFalse();

    flow.setBusiness(BUSINESS);
    expect(flow.hasBusiness()).toBeTrue();
    expect(flow.hasIdentity()).toBeFalse();

    flow.setIdentity(IDENTITY);
    expect(flow.hasIdentity()).toBeTrue();
    expect(flow.hasLocation()).toBeFalse();

    flow.setLocation(LOCATION);
    expect(flow.hasLocation()).toBeTrue();
  });

  it('treats a later step as unreachable while an earlier one is missing', () => {
    // Identity set without business must not unlock step 3 — otherwise a
    // partially-filled application could be submitted.
    flow.setIdentity(IDENTITY);
    expect(flow.hasIdentity()).toBeFalse();
    expect(flow.hasLocation()).toBeFalse();
  });

  it('clears everything on reset', () => {
    flow.setBusiness(BUSINESS);
    flow.setIdentity(IDENTITY);
    flow.setLocation(LOCATION);

    flow.reset();

    expect(flow.hasBusiness()).toBeFalse();
    expect(flow.hasLocation()).toBeFalse();
  });
});

describe('onboardingStepGuard', () => {
  let flow: OnboardingFlow;

  function run(step: 'identity' | 'location' | 'confirm') {
    return TestBed.runInInjectionContext(() =>
      // The guard reads neither argument; the router state is irrelevant here.
      (onboardingStepGuard(step) as unknown as () => boolean | UrlTree)(),
    );
  }

  function urlOf(result: unknown): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), OnboardingFlow] });
    flow = TestBed.inject(OnboardingFlow);
  });

  it('blocks every step from a cold start', () => {
    expect(urlOf(run('identity'))).toBe('/auth/contractor-register');
    expect(urlOf(run('confirm'))).toBe('/auth/contractor-register');
  });

  it('allows a step whose prerequisite is met', () => {
    flow.setBusiness(BUSINESS);
    expect(run('identity')).toBeTrue();

    flow.setIdentity(IDENTITY);
    expect(run('location')).toBeTrue();

    flow.setLocation(LOCATION);
    expect(run('confirm')).toBeTrue();
  });

  it('redirects to the furthest completed step, not always the first', () => {
    flow.setBusiness(BUSINESS);
    expect(urlOf(run('confirm'))).toBe('/auth/contractor-register/identity');

    flow.setIdentity(IDENTITY);
    expect(urlOf(run('confirm'))).toBe('/auth/contractor-register/location');
  });
});
