import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { OnboardingFlow } from './features/auth/contractor-register/onboarding-flow.service';
import { onboardingStepGuard } from './features/auth/contractor-register/onboarding-step.guard';
import { PasswordResetFlow } from './features/auth/password-reset/password-reset-flow.service';
import { passwordResetStepGuard } from './features/auth/password-reset/password-reset-step.guard';

/**
 * Route map for the back-office portal, ported from the legacy TopProz Angular
 * 10 app. `ROUTE-MAP.md` at the repo root is the authoritative inventory of all
 * ~130 legacy routes and tracks which have been ported; routes appear here only
 * once their page actually exists, so the build never points at a stub.
 */

/**
 * Shared by `/auth/forgot-password` and `/auth/activate`: both prove control of
 * the address the same way and differ only in their last step. The legacy
 * portal ran both through one component branching on a `mode` query param.
 */
const passwordResetChildren: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/auth/password-reset/request/request').then((m) => m.PasswordResetRequest),
  },
  {
    path: 'method',
    canActivate: [passwordResetStepGuard('method')],
    loadComponent: () =>
      import('./features/auth/password-reset/method/method').then((m) => m.PasswordResetMethod),
  },
  {
    path: 'verify',
    canActivate: [passwordResetStepGuard('verify')],
    loadComponent: () =>
      import('./features/auth/password-reset/verify/verify').then((m) => m.PasswordResetVerify),
  },
  {
    path: 'reset',
    canActivate: [passwordResetStepGuard('reset')],
    loadComponent: () =>
      import('./features/auth/password-reset/reset/reset').then((m) => m.PasswordResetReset),
  },
  {
    path: 'activate',
    canActivate: [passwordResetStepGuard('reset')],
    loadComponent: () =>
      import('./features/auth/password-reset/activate/activate').then(
        (m) => m.PasswordResetActivate,
      ),
  },
];

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/sign-in',
  },

  // ---- Public / unauthenticated ----
  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-shell/auth-shell').then((m) => m.AuthShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sign-in',
      },
      {
        path: 'sign-in',
        loadComponent: () => import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        // Same reason as the reset flow: the step guards resolve the flow
        // service before any component is created, so it is provided here.
        path: 'contractor-register',
        providers: [OnboardingFlow],
        loadComponent: () =>
          import('./features/auth/contractor-register/contractor-register').then(
            (m) => m.ContractorRegister,
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/auth/contractor-register/business/business').then(
                (m) => m.OnboardingBusiness,
              ),
          },
          {
            path: 'identity',
            canActivate: [onboardingStepGuard('identity')],
            loadComponent: () =>
              import('./features/auth/contractor-register/identity/identity').then(
                (m) => m.OnboardingIdentity,
              ),
          },
          {
            path: 'location',
            canActivate: [onboardingStepGuard('location')],
            loadComponent: () =>
              import('./features/auth/contractor-register/location/location').then(
                (m) => m.OnboardingLocation,
              ),
          },
          {
            path: 'capacity',
            canActivate: [onboardingStepGuard('capacity')],
            loadComponent: () =>
              import('./features/auth/contractor-register/capacity/capacity').then(
                (m) => m.OnboardingCapacity,
              ),
          },
          {
            path: 'credentials',
            canActivate: [onboardingStepGuard('credentials')],
            loadComponent: () =>
              import('./features/auth/contractor-register/credentials/credentials').then(
                (m) => m.OnboardingCredentials,
              ),
          },
          {
            path: 'confirm',
            canActivate: [onboardingStepGuard('confirm')],
            loadComponent: () =>
              import('./features/auth/contractor-register/confirm/confirm').then(
                (m) => m.OnboardingConfirm,
              ),
          },
        ],
      },
      // `PasswordResetFlow` is provided per-route rather than on the parent
      // component: the step guards resolve it before any component exists, and
      // each mount point gets its own instance scoped to that route's lifetime.
      {
        path: 'forgot-password',
        data: { intent: 'reset' },
        providers: [PasswordResetFlow],
        loadComponent: () =>
          import('./features/auth/password-reset/password-reset').then((m) => m.PasswordReset),
        children: passwordResetChildren,
      },
      {
        path: 'activate',
        data: { intent: 'activate' },
        providers: [PasswordResetFlow],
        loadComponent: () =>
          import('./features/auth/password-reset/password-reset').then((m) => m.PasswordReset),
        children: passwordResetChildren,
      },
    ],
  },

  // ---- Authenticated back-office shell ----
  {
    path: 'app',
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [],
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
