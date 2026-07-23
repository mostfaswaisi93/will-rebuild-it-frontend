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
    loadComponent: () => import('./features/public/home/home').then((m) => m.PublicHome),
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
        path: 'supplier-dashboard',
        canActivate: [roleGuard(['supplier'])],
        loadComponent: () =>
          import('./features/suppliers/supplier-dashboard/supplier-dashboard').then(
            (m) => m.SupplierDashboard,
          ),
      },
      {
        path: 'dispatch',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/dispatch/dispatch-board/dispatch-board').then((m) => m.DispatchBoard),
      },
      {
        path: 'inspections',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/inspections/inspection-list/inspection-list').then(
            (m) => m.InspectionList,
          ),
      },
      {
        path: 'shipments',
        canActivate: [roleGuard(['admin', 'supplier'])],
        loadComponent: () =>
          import('./features/shipments/shipment-list/shipment-list').then((m) => m.ShipmentList),
      },
      {
        path: 'price-lists',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/price-list/price-list/price-list').then((m) => m.PriceList),
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
      {
        path: 'inventory',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/inventory/stock-list/stock-list').then((m) => m.StockList),
      },
      {
        path: 'warehouses',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/inventory/warehouse-list/warehouse-list').then((m) => m.WarehouseList),
      },
      {
        path: 'purchase-orders',
        canActivate: [roleGuard(['admin', 'contractor', 'supplier'])],
        loadComponent: () =>
          import('./features/inventory/purchase-order-list/purchase-order-list').then(
            (m) => m.PurchaseOrderList,
          ),
      },
      {
        path: 'purchase-orders/:id',
        canActivate: [roleGuard(['admin', 'contractor', 'supplier'])],
        loadComponent: () =>
          import('./features/inventory/purchase-order-detail/purchase-order-detail').then(
            (m) => m.PurchaseOrderDetail,
          ),
      },
      {
        path: 'equipment',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/equipment/equipment-list/equipment-list').then((m) => m.EquipmentList),
      },
      {
        // Must precede `equipment/:id`, or `:id` captures the literal "schedule".
        path: 'equipment/schedule',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/equipment/equipment-schedule/equipment-schedule').then(
            (m) => m.EquipmentSchedule,
          ),
      },
      {
        // Literal segments must precede `equipment/:id`, or `:id` captures them.
        path: 'equipment/new',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/equipment/equipment-form/equipment-form').then((m) => m.EquipmentForm),
      },
      {
        path: 'equipment/reports',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/equipment/equipment-reports/equipment-reports').then(
            (m) => m.EquipmentReports,
          ),
      },
      {
        path: 'equipment/:id/edit',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/equipment/equipment-form/equipment-form').then((m) => m.EquipmentForm),
      },
      {
        path: 'equipment/:id',
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/equipment/equipment-detail/equipment-detail').then(
            (m) => m.EquipmentDetail,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notification-list/notification-list').then(
            (m) => m.NotificationList,
          ),
      },
      {
        path: 'support',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/support/support-list/support-list').then((m) => m.SupportList),
      },
      {
        path: 'support/:id',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/support/support-detail/support-detail').then((m) => m.SupportDetail),
      },
      {
        path: 'disbursements',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/disbursements/disbursement-list/disbursement-list').then(
            (m) => m.DisbursementList,
          ),
      },
      {
        path: 'disbursements/:id',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/disbursements/disbursement-detail/disbursement-detail').then(
            (m) => m.DisbursementDetail,
          ),
      },
      {
        path: 'global-settings',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/settings-hub/settings-hub').then((m) => m.SettingsHub),
      },
      {
        path: 'global-settings/terms',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/terms-list/terms-list').then((m) => m.TermsList),
      },
      {
        path: 'global-settings/geofencing',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/geofencing/geofencing').then((m) => m.Geofencing),
      },
      {
        path: 'global-settings/reference',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/reference-data/reference-data').then((m) => m.ReferenceData),
      },
      {
        // Personal settings (data use + notification preferences), so no role
        // guard — every signed-in role has an account to manage.
        path: 'account-settings',
        loadComponent: () =>
          import('./features/settings/account-settings/account-settings').then(
            (m) => m.AccountSettings,
          ),
      },
      {
        path: 'permissions',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/permissions/permissions').then((m) => m.Permissions),
      },
      {
        path: 'scorecards',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/scorecards/scorecard-list/scorecard-list').then((m) => m.ScorecardList),
      },
      {
        path: 'scorecards/:id',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/scorecards/scorecard-detail/scorecard-detail').then(
            (m) => m.ScorecardDetail,
          ),
      },
      {
        path: 'questions',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/questions/question-bank/question-bank').then((m) => m.QuestionBank),
      },
      {
        path: 'staff',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/staff/staff-list/staff-list').then((m) => m.StaffList),
      },
      {
        path: 'staff/:id',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/staff/staff-profile/staff-profile').then((m) => m.StaffProfile),
      },
      {
        path: 'campaigns',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/campaigns/campaign-list/campaign-list').then((m) => m.CampaignList),
      },
      {
        path: 'campaigns/:id',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/campaigns/campaign-detail/campaign-detail').then((m) => m.CampaignDetail),
      },
      {
        path: 'logs',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () => import('./features/logs/log-list/log-list').then((m) => m.LogList),
      },
      {
        path: 'external-ratings',
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/monitoring/monitoring-list/monitoring-list').then((m) => m.MonitoringList),
      },
      {
        path: 'subscriptions',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/subscriptions/subscription-list/subscription-list').then(
            (m) => m.SubscriptionList,
          ),
      },
      {
        path: 'subscriptions/:id',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/subscriptions/subscription-detail/subscription-detail').then(
            (m) => m.SubscriptionDetail,
          ),
      },

      // --- Beneficiary experience (role home: /app/dashboard) ---------------
      {
        path: 'dashboard',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/dashboard/beneficiary-dashboard/beneficiary-dashboard').then(
            (m) => m.BeneficiaryDashboard,
          ),
      },
      {
        path: 'requests',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/requests/request-list/request-list').then((m) => m.RequestList),
      },
      {
        path: 'requests/:id',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/requests/request-detail/request-detail').then((m) => m.RequestDetail),
      },
      {
        path: 'projects',
        canActivate: [roleGuard(['beneficiary', 'admin', 'team'])],
        loadComponent: () =>
          import('./features/projects/project-list/project-list').then((m) => m.ProjectList),
      },
      {
        path: 'projects/:id',
        canActivate: [roleGuard(['beneficiary', 'admin', 'team'])],
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail').then((m) => m.ProjectDetail),
      },
      {
        path: 'teams',
        canActivate: [roleGuard(['beneficiary', 'admin', 'team', 'contractor'])],
        loadComponent: () =>
          import('./features/teams/team-list/team-list').then((m) => m.TeamList),
      },
      {
        path: 'teams/:id',
        canActivate: [roleGuard(['beneficiary', 'admin', 'team', 'contractor'])],
        loadComponent: () =>
          import('./features/teams/team-detail/team-detail').then((m) => m.TeamDetail),
      },
      {
        path: 'funding',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/funding/funding-list/funding-list').then((m) => m.FundingList),
      },
      {
        path: 'reviews',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/reviews/review-list/review-list').then((m) => m.ReviewList),
      },

      // --- Donor experience (role home: /app/donations) --------------------
      {
        path: 'donations',
        canActivate: [roleGuard(['donor'])],
        loadComponent: () =>
          import('./features/donations/donation-list/donation-list').then((m) => m.DonationList),
      },

      // --- Team workspace (role home: /app/team-dashboard) -----------------
      {
        path: 'team-dashboard',
        canActivate: [roleGuard(['team'])],
        loadComponent: () =>
          import('./features/team-workspace/team-dashboard/team-dashboard').then(
            (m) => m.TeamDashboard,
          ),
      },

      // --- Header user menu, reachable from every role ---------------------
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
      },
      {
        // Must precede `complaints/:id` if a detail is ever added.
        path: 'complaints/new',
        loadComponent: () =>
          import('./features/complaints/complaint-form/complaint-form').then((m) => m.ComplaintForm),
      },
      {
        path: 'complaints',
        loadComponent: () =>
          import('./features/complaints/complaint-list/complaint-list').then((m) => m.ComplaintList),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./features/content/privacy-page/privacy-page').then((m) => m.PrivacyPage),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
