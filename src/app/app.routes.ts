import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';
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
        path: 'registered',
        loadComponent: () =>
          import('./features/auth/register/registered/registered').then((m) => m.Registered),
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
    children: [
      {
        path: '',
        pathMatch: 'full',
        // No single landing page suits every role, so bounce through the guard,
        // which knows each role's home.
        canActivate: [roleGuard([])],
        children: [],
      },
      {
        path: 'admin-dashboard',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'contractor-dashboard',
        canActivate: [roleGuard(['contractor'])],
        loadComponent: () =>
          import('./features/dashboard/contractor-dashboard/contractor-dashboard').then(
            (m) => m.ContractorDashboard,
          ),
      },
      {
        path: 'staff-dashboard',
        canActivate: [roleGuard(['staff'])],
        loadComponent: () =>
          import('./features/dashboard/staff-dashboard/staff-dashboard').then((m) => m.StaffDashboard),
      },
      {
        path: 'work-requests',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/work-requests/work-request-list/work-request-list').then(
            (m) => m.WorkRequestList,
          ),
      },
      {
        // Must precede `work-requests/:id`, or `:id` captures the literal "new".
        path: 'work-requests/new',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/work-requests/work-request-new/work-request-new').then(
            (m) => m.WorkRequestNew,
          ),
      },
      {
        path: 'work-requests/:id',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/work-requests/work-request-detail/work-request-detail').then(
            (m) => m.WorkRequestDetail,
          ),
      },
      {
        path: 'estimates',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/estimates/estimate-list/estimate-list').then((m) => m.EstimateList),
      },
      {
        path: 'estimates/:id',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/estimates/estimate-detail/estimate-detail').then(
            (m) => m.EstimateDetail,
          ),
      },
      {
        path: 'work-orders',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/work-orders/work-order-list/work-order-list').then(
            (m) => m.WorkOrderList,
          ),
      },
      {
        path: 'work-orders/:id/inspection/:kind',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/work-orders/work-order-inspection/work-order-inspection').then(
            (m) => m.WorkOrderInspection,
          ),
      },
      {
        path: 'work-orders/:id',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/work-orders/work-order-detail/work-order-detail').then(
            (m) => m.WorkOrderDetail,
          ),
      },
      {
        path: 'statements',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/statements/statement-list/statement-list').then((m) => m.StatementList),
      },
      {
        path: 'statements/:id',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/statements/statement-detail/statement-detail').then(
            (m) => m.StatementDetail,
          ),
      },
      {
        // Managing the rate catalogue is an operator responsibility.
        path: 'pricebook',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/pricebook/pricebook-list/pricebook-list').then((m) => m.PricebookList),
      },
      {
        path: 'contractors',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/contractors/contractor-list/contractor-list').then(
            (m) => m.ContractorList,
          ),
      },
      {
        path: 'contractors/:id',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/contractors/contractor-profile/contractor-profile').then(
            (m) => m.ContractorProfile,
          ),
      },
      {
        path: 'beneficiaries',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/beneficiaries/beneficiary-list/beneficiary-list').then(
            (m) => m.BeneficiaryList,
          ),
      },
      {
        path: 'beneficiaries/:id',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/beneficiaries/beneficiary-detail/beneficiary-detail').then(
            (m) => m.BeneficiaryDetail,
          ),
      },
      {
        path: 'suppliers',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/suppliers/supplier-list/supplier-list').then((m) => m.SupplierList),
      },
      {
        path: 'suppliers/:id',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/suppliers/supplier-profile/supplier-profile').then(
            (m) => m.SupplierProfile,
          ),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
