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
    // This step's heading is rendered by the shared shell rather than its own
    // page-header, so the key is stated here instead of being derived from it.
    data: { titleKey: 'auth.reset.request.title' },
    loadComponent: () =>
      import('./features/auth/password-reset/request/request').then((m) => m.PasswordResetRequest),
  },
  {
    path: 'method',
    data: { titleKey: 'auth.reset.method.title' },
    canActivate: [passwordResetStepGuard('method')],
    loadComponent: () =>
      import('./features/auth/password-reset/method/method').then((m) => m.PasswordResetMethod),
  },
  {
    path: 'verify',
    data: { titleKey: 'auth.reset.verify.title' },
    canActivate: [passwordResetStepGuard('verify')],
    loadComponent: () =>
      import('./features/auth/password-reset/verify/verify').then((m) => m.PasswordResetVerify),
  },
  {
    path: 'reset',
    data: { titleKey: 'auth.reset.reset.title' },
    canActivate: [passwordResetStepGuard('reset')],
    loadComponent: () =>
      import('./features/auth/password-reset/reset/reset').then((m) => m.PasswordResetReset),
  },
  {
    path: 'activate',
    data: { titleKey: 'auth.reset.activate.title' },
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
  {
    // Public, shareable team profile — server-rendered via the `**` rule.
    path: 'pub/contractor/:id',
    data: { titleKey: 'public.contractor.title' },
    loadComponent: () =>
      import('./features/public/contractor-public/contractor-public').then((m) => m.ContractorPublic),
  },
  {
    path: 'pub/project/:id',
    data: { titleKey: 'public.projectPublic.title' },
    loadComponent: () =>
      import('./features/public/project-public/project-public').then((m) => m.ProjectPublic),
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
        data: { titleKey: 'auth.signIn.title' },
        loadComponent: () => import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
      },
      {
        path: 'register',
        data: { titleKey: 'auth.register.title' },
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'registered',
        data: { titleKey: 'auth.registered.title' },
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
            data: { titleKey: 'auth.onboarding.business.title' },
            loadComponent: () =>
              import('./features/auth/contractor-register/business/business').then(
                (m) => m.OnboardingBusiness,
              ),
          },
          {
            path: 'identity',
            data: { titleKey: 'auth.onboarding.identity.title' },
            canActivate: [onboardingStepGuard('identity')],
            loadComponent: () =>
              import('./features/auth/contractor-register/identity/identity').then(
                (m) => m.OnboardingIdentity,
              ),
          },
          {
            path: 'location',
            data: { titleKey: 'auth.onboarding.location.title' },
            canActivate: [onboardingStepGuard('location')],
            loadComponent: () =>
              import('./features/auth/contractor-register/location/location').then(
                (m) => m.OnboardingLocation,
              ),
          },
          {
            path: 'capacity',
            data: { titleKey: 'auth.onboarding.capacity.title' },
            canActivate: [onboardingStepGuard('capacity')],
            loadComponent: () =>
              import('./features/auth/contractor-register/capacity/capacity').then(
                (m) => m.OnboardingCapacity,
              ),
          },
          {
            path: 'credentials',
            data: { titleKey: 'auth.onboarding.credentials.title' },
            canActivate: [onboardingStepGuard('credentials')],
            loadComponent: () =>
              import('./features/auth/contractor-register/credentials/credentials').then(
                (m) => m.OnboardingCredentials,
              ),
          },
          {
            path: 'confirm',
            data: { titleKey: 'auth.onboarding.confirm.title' },
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
        data: { titleKey: 'dashboard.admin.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'contractor-dashboard',
        data: { titleKey: 'dashboard.contractor.title' },
        canActivate: [roleGuard(['contractor'])],
        loadComponent: () =>
          import('./features/dashboard/contractor-dashboard/contractor-dashboard').then(
            (m) => m.ContractorDashboard,
          ),
      },
      {
        path: 'staff-dashboard',
        data: { titleKey: 'dashboard.staff.title' },
        canActivate: [roleGuard(['staff'])],
        loadComponent: () =>
          import('./features/dashboard/staff-dashboard/staff-dashboard').then((m) => m.StaffDashboard),
      },
      {
        path: 'supplier-dashboard',
        data: { titleKey: 'supplierDashboard.title' },
        canActivate: [roleGuard(['supplier'])],
        loadComponent: () =>
          import('./features/suppliers/supplier-dashboard/supplier-dashboard').then(
            (m) => m.SupplierDashboard,
          ),
      },
      {
        path: 'dispatch',
        data: { titleKey: 'dispatch.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/dispatch/dispatch-board/dispatch-board').then((m) => m.DispatchBoard),
      },
      {
        path: 'inspections',
        data: { titleKey: 'inspections.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/inspections/inspection-list/inspection-list').then(
            (m) => m.InspectionList,
          ),
      },
      {
        path: 'shipments',
        data: { titleKey: 'shipments.title' },
        canActivate: [roleGuard(['admin', 'supplier'])],
        loadComponent: () =>
          import('./features/shipments/shipment-list/shipment-list').then((m) => m.ShipmentList),
      },
      {
        path: 'shipments/:id',
        data: { titleKey: 'shipments.detail.title' },
        canActivate: [roleGuard(['admin', 'supplier'])],
        loadComponent: () =>
          import('./features/shipments/shipment-detail/shipment-detail').then(
            (m) => m.ShipmentDetail,
          ),
      },
      {
        path: 'price-lists',
        data: { titleKey: 'priceList.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/price-list/price-list/price-list').then((m) => m.PriceList),
      },
      {
        path: 'work-requests',
        data: { titleKey: 'workRequests.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/work-requests/work-request-list/work-request-list').then(
            (m) => m.WorkRequestList,
          ),
      },
      {
        // Must precede `work-requests/:id`, or `:id` captures the literal "new".
        path: 'work-requests/new',
        data: { titleKey: 'workRequests.new.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/work-requests/work-request-new/work-request-new').then(
            (m) => m.WorkRequestNew,
          ),
      },
      {
        path: 'work-requests/:id',
        data: { titleKey: 'workRequests.detail.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/work-requests/work-request-detail/work-request-detail').then(
            (m) => m.WorkRequestDetail,
          ),
      },
      {
        path: 'estimates',
        data: { titleKey: 'estimates.title' },
        // A beneficiary sees what their rebuild is costed at, and a team sees
        // its own estimates; deciding stays with the operator (`canDecide`).
        canActivate: [roleGuard(['admin', 'contractor', 'beneficiary', 'team'])],
        loadComponent: () =>
          import('./features/estimates/estimate-list/estimate-list').then((m) => m.EstimateList),
      },
      {
        path: 'estimates/:id',
        data: { titleKey: 'estimates.detail.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'beneficiary', 'team'])],
        loadComponent: () =>
          import('./features/estimates/estimate-detail/estimate-detail').then(
            (m) => m.EstimateDetail,
          ),
      },
      {
        path: 'work-orders',
        data: { titleKey: 'workOrders.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/work-orders/work-order-list/work-order-list').then(
            (m) => m.WorkOrderList,
          ),
      },
      {
        path: 'work-orders/:id/inspection/:kind',
        data: { titleKey: 'workOrders.inspection.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/work-orders/work-order-inspection/work-order-inspection').then(
            (m) => m.WorkOrderInspection,
          ),
      },
      {
        path: 'work-orders/:id',
        data: { titleKey: 'workOrders.detail.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/work-orders/work-order-detail/work-order-detail').then(
            (m) => m.WorkOrderDetail,
          ),
      },
      {
        path: 'statements',
        data: { titleKey: 'statements.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/statements/statement-list/statement-list').then((m) => m.StatementList),
      },
      {
        path: 'statements/:id',
        data: { titleKey: 'statements.detail.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/statements/statement-detail/statement-detail').then(
            (m) => m.StatementDetail,
          ),
      },
      {
        // Managing the rate catalogue is an operator responsibility.
        path: 'pricebook',
        data: { titleKey: 'pricebook.title' },
        // Contractors read the rates their estimates are built on; only an
        // operator may edit them (gated in the page by `canManage`).
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/pricebook/pricebook-list/pricebook-list').then((m) => m.PricebookList),
      },
      {
        path: 'contractors',
        data: { titleKey: 'contractors.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/contractors/contractor-list/contractor-list').then(
            (m) => m.ContractorList,
          ),
      },
      {
        path: 'contractors/:id',
        data: { titleKey: 'contractors.profile.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/contractors/contractor-profile/contractor-profile').then(
            (m) => m.ContractorProfile,
          ),
      },
      {
        path: 'beneficiaries',
        data: { titleKey: 'beneficiaries.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/beneficiaries/beneficiary-list/beneficiary-list').then(
            (m) => m.BeneficiaryList,
          ),
      },
      {
        path: 'beneficiaries/:id',
        data: { titleKey: 'beneficiaries.detail.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/beneficiaries/beneficiary-detail/beneficiary-detail').then(
            (m) => m.BeneficiaryDetail,
          ),
      },
      {
        path: 'suppliers',
        data: { titleKey: 'suppliers.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/suppliers/supplier-list/supplier-list').then((m) => m.SupplierList),
      },
      {
        path: 'suppliers/:id',
        data: { titleKey: 'suppliers.detail.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/suppliers/supplier-profile/supplier-profile').then(
            (m) => m.SupplierProfile,
          ),
      },
      {
        path: 'inventory',
        data: { titleKey: 'inventory.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/inventory/stock-list/stock-list').then((m) => m.StockList),
      },
      {
        path: 'inventory/:id',
        data: { titleKey: 'inventory.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/inventory/stock-detail/stock-detail').then((m) => m.StockDetail),
      },
      {
        path: 'warehouses',
        data: { titleKey: 'warehouses.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/inventory/warehouse-list/warehouse-list').then((m) => m.WarehouseList),
      },
      {
        path: 'warehouses/:id',
        data: { titleKey: 'warehouses.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/inventory/warehouse-detail/warehouse-detail').then(
            (m) => m.WarehouseDetail,
          ),
      },
      {
        path: 'purchase-orders',
        data: { titleKey: 'purchaseOrders.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'supplier'])],
        loadComponent: () =>
          import('./features/inventory/purchase-order-list/purchase-order-list').then(
            (m) => m.PurchaseOrderList,
          ),
      },
      {
        // Must precede `purchase-orders/:id`, or `:id` captures the literal "new".
        path: 'purchase-orders/new',
        data: { titleKey: 'purchaseOrders.form.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/inventory/purchase-order-new/purchase-order-new').then(
            (m) => m.PurchaseOrderNew,
          ),
      },
      {
        path: 'purchase-orders/:id',
        data: { titleKey: 'purchaseOrders.detail.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'supplier'])],
        loadComponent: () =>
          import('./features/inventory/purchase-order-detail/purchase-order-detail').then(
            (m) => m.PurchaseOrderDetail,
          ),
      },
      {
        path: 'equipment',
        data: { titleKey: 'equipment.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/equipment/equipment-list/equipment-list').then((m) => m.EquipmentList),
      },
      {
        // Must precede `equipment/:id`, or `:id` captures the literal "schedule".
        path: 'equipment/schedule',
        data: { titleKey: 'equipment.schedule.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/equipment/equipment-schedule/equipment-schedule').then(
            (m) => m.EquipmentSchedule,
          ),
      },
      {
        // Literal segments must precede `equipment/:id`, or `:id` captures them.
        path: 'equipment/new',
        data: { titleKey: 'equipment.form.newTitle' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/equipment/equipment-form/equipment-form').then((m) => m.EquipmentForm),
      },
      {
        path: 'equipment/reports',
        data: { titleKey: 'equipment.reports.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/equipment/equipment-reports/equipment-reports').then(
            (m) => m.EquipmentReports,
          ),
      },
      {
        path: 'equipment/:id/edit',
        data: { titleKey: 'equipment.form.editTitle' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/equipment/equipment-form/equipment-form').then((m) => m.EquipmentForm),
      },
      {
        path: 'equipment/:id',
        data: { titleKey: 'equipment.detail.title' },
        canActivate: [roleGuard(['admin', 'contractor', 'staff'])],
        loadComponent: () =>
          import('./features/equipment/equipment-detail/equipment-detail').then(
            (m) => m.EquipmentDetail,
          ),
      },
      {
        // Must precede `notifications` is unnecessary (distinct segments), but
        // keep the compose route beside its list for readability.
        path: 'notifications/push',
        data: { titleKey: 'notifications.broadcast.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/notifications/notification-broadcast/notification-broadcast').then(
            (m) => m.NotificationBroadcast,
          ),
      },
      {
        path: 'notifications',
        data: { titleKey: 'notifications.list.title' },
        loadComponent: () =>
          import('./features/notifications/notification-list/notification-list').then(
            (m) => m.NotificationList,
          ),
      },
      {
        path: 'support',
        data: { titleKey: 'supportQueue.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/support/support-list/support-list').then((m) => m.SupportList),
      },
      {
        // Must precede `support/:id`, or `:id` captures the literal "new".
        path: 'support/new',
        data: { titleKey: 'support.form.title' },
        loadComponent: () =>
          import('./features/support/support-new/support-new').then((m) => m.SupportNew),
      },
      {
        path: 'support/:id',
        data: { titleKey: 'support.view.notFound' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/support/support-detail/support-detail').then((m) => m.SupportDetail),
      },
      {
        path: 'disbursements',
        data: { titleKey: 'disbursements.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/disbursements/disbursement-list/disbursement-list').then(
            (m) => m.DisbursementList,
          ),
      },
      {
        path: 'disbursements/:id',
        data: { titleKey: 'disbursements.detail.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/disbursements/disbursement-detail/disbursement-detail').then(
            (m) => m.DisbursementDetail,
          ),
      },
      {
        path: 'global-settings',
        data: { titleKey: 'settings.hub.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/settings-hub/settings-hub').then((m) => m.SettingsHub),
      },
      {
        path: 'global-settings/terms',
        data: { titleKey: 'settings.terms.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/terms-list/terms-list').then((m) => m.TermsList),
      },
      {
        path: 'global-settings/geofencing',
        data: { titleKey: 'settings.geofencing.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/geofencing/geofencing').then((m) => m.Geofencing),
      },
      {
        path: 'global-settings/reference',
        data: { titleKey: 'settings.reference.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/reference-data/reference-data').then((m) => m.ReferenceData),
      },
      {
        // Personal settings (data use + notification preferences), so no role
        // guard — every signed-in role has an account to manage.
        path: 'account-settings',
        data: { titleKey: 'account.title' },
        loadComponent: () =>
          import('./features/settings/account-settings/account-settings').then(
            (m) => m.AccountSettings,
          ),
      },
      {
        path: 'permissions',
        data: { titleKey: 'permissions.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/settings/permissions/permissions').then((m) => m.Permissions),
      },
      {
        path: 'scorecards',
        data: { titleKey: 'scorecards.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/scorecards/scorecard-list/scorecard-list').then((m) => m.ScorecardList),
      },
      {
        path: 'scorecards/:id',
        data: { titleKey: 'scorecards.detail.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/scorecards/scorecard-detail/scorecard-detail').then(
            (m) => m.ScorecardDetail,
          ),
      },
      {
        path: 'questions',
        data: { titleKey: 'questions.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/questions/question-bank/question-bank').then((m) => m.QuestionBank),
      },
      {
        path: 'staff',
        data: { titleKey: 'staff.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/staff/staff-list/staff-list').then((m) => m.StaffList),
      },
      {
        path: 'staff/:id',
        data: { titleKey: 'staff.profile.title' },
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () =>
          import('./features/staff/staff-profile/staff-profile').then((m) => m.StaffProfile),
      },
      {
        path: 'campaigns',
        data: { titleKey: 'campaigns.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/campaigns/campaign-list/campaign-list').then((m) => m.CampaignList),
      },
      {
        path: 'campaigns/:id',
        data: { titleKey: 'campaigns.detail.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/campaigns/campaign-detail/campaign-detail').then((m) => m.CampaignDetail),
      },
      {
        path: 'logs',
        data: { titleKey: 'logs.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () => import('./features/logs/log-list/log-list').then((m) => m.LogList),
      },
      {
        path: 'external-ratings',
        data: { titleKey: 'monitoring.title' },
        canActivate: [roleGuard(['admin', 'staff'])],
        loadComponent: () =>
          import('./features/monitoring/monitoring-list/monitoring-list').then((m) => m.MonitoringList),
      },
      {
        path: 'subscriptions',
        data: { titleKey: 'subscriptions.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/subscriptions/subscription-list/subscription-list').then(
            (m) => m.SubscriptionList,
          ),
      },
      {
        // Must precede `subscriptions/:id`, or `:id` captures the literal "plans".
        path: 'subscriptions/plans',
        data: { titleKey: 'subscriptions.plans.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/subscriptions/subscription-plans/subscription-plans').then(
            (m) => m.SubscriptionPlans,
          ),
      },
      {
        path: 'subscriptions/:id',
        data: { titleKey: 'subscriptions.detail.title' },
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/subscriptions/subscription-detail/subscription-detail').then(
            (m) => m.SubscriptionDetail,
          ),
      },

      // --- Beneficiary experience (role home: /app/dashboard) ---------------
      {
        path: 'dashboard',
        data: { titleKey: 'dashboard.greetingGeneric' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/dashboard/beneficiary-dashboard/beneficiary-dashboard').then(
            (m) => m.BeneficiaryDashboard,
          ),
      },
      {
        path: 'requests',
        data: { titleKey: 'requests.list.title' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/requests/request-list/request-list').then((m) => m.RequestList),
      },
      {
        // Must precede `requests/:id`, or `:id` captures the literal "new".
        path: 'requests/new',
        data: { titleKey: 'requests.new.title' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/requests/request-new/request-new').then((m) => m.RequestNew),
      },
      {
        path: 'requests/:id',
        data: { titleKey: 'requests.list.title' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/requests/request-detail/request-detail').then((m) => m.RequestDetail),
      },
      {
        path: 'projects',
        data: { titleKey: 'projects.list.title' },
        canActivate: [roleGuard(['beneficiary', 'admin', 'team'])],
        loadComponent: () =>
          import('./features/projects/project-list/project-list').then((m) => m.ProjectList),
      },
      {
        path: 'projects/:id',
        data: { titleKey: 'projects.list.title' },
        canActivate: [roleGuard(['beneficiary', 'admin', 'team'])],
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail').then((m) => m.ProjectDetail),
      },
      {
        path: 'teams',
        data: { titleKey: 'teams.list.title' },
        canActivate: [roleGuard(['beneficiary', 'admin', 'team', 'contractor'])],
        loadComponent: () =>
          import('./features/teams/team-list/team-list').then((m) => m.TeamList),
      },
      {
        path: 'teams/:id',
        data: { titleKey: 'teams.profile.title' },
        canActivate: [roleGuard(['beneficiary', 'admin', 'team', 'contractor'])],
        loadComponent: () =>
          import('./features/teams/team-detail/team-detail').then((m) => m.TeamDetail),
      },
      {
        path: 'funding',
        data: { titleKey: 'funding.list.title' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/funding/funding-list/funding-list').then((m) => m.FundingList),
      },
      {
        path: 'funding/:id',
        data: { titleKey: 'funding.list.title' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/funding/funding-detail/funding-detail').then((m) => m.FundingDetail),
      },
      {
        // Both params bind as component inputs via `withComponentInputBinding`.
        path: 'funding/:fundingId/disbursements/:id',
        data: { titleKey: 'funding.txn.title' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/funding/disbursement-detail/disbursement-detail').then(
            (m) => m.DisbursementDetail,
          ),
      },
      {
        path: 'reviews',
        data: { titleKey: 'reviews.title' },
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/reviews/review-list/review-list').then((m) => m.ReviewList),
      },

      // --- Donor experience (role home: /app/donations) --------------------
      {
        path: 'donations',
        data: { titleKey: 'donations.list.title' },
        canActivate: [roleGuard(['donor'])],
        loadComponent: () =>
          import('./features/donations/donation-list/donation-list').then((m) => m.DonationList),
      },
      {
        // Must precede `donations/:id`, or `:id` captures the literal "new".
        path: 'donations/new',
        data: { titleKey: 'donations.donate.title' },
        canActivate: [roleGuard(['donor'])],
        loadComponent: () =>
          import('./features/donations/donation-new/donation-new').then((m) => m.DonationNew),
      },
      {
        path: 'donations/:id',
        data: { titleKey: 'donations.detail.title' },
        canActivate: [roleGuard(['donor'])],
        loadComponent: () =>
          import('./features/donations/donation-detail/donation-detail').then(
            (m) => m.DonationDetail,
          ),
      },

      // --- Team workspace (role home: /app/team-dashboard) -----------------
      {
        path: 'team-dashboard',
        data: { titleKey: 'teamWorkspace.subtitle' },
        canActivate: [roleGuard(['team'])],
        loadComponent: () =>
          import('./features/team-workspace/team-dashboard/team-dashboard').then(
            (m) => m.TeamDashboard,
          ),
      },

      // --- Header user menu, reachable from every role ---------------------
      {
        path: 'profile',
        data: { titleKey: 'profile.title' },
        loadComponent: () =>
          import('./features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
      },
      {
        // Must precede `complaints/:id` if a detail is ever added.
        path: 'complaints/new',
        data: { titleKey: 'complaints.form.title' },
        loadComponent: () =>
          import('./features/complaints/complaint-form/complaint-form').then((m) => m.ComplaintForm),
      },
      {
        path: 'complaints',
        data: { titleKey: 'complaints.list.title' },
        loadComponent: () =>
          import('./features/complaints/complaint-list/complaint-list').then((m) => m.ComplaintList),
      },
      {
        path: 'complaints/:id',
        data: { titleKey: 'complaints.list.title' },
        loadComponent: () =>
          import('./features/complaints/complaint-detail/complaint-detail').then(
            (m) => m.ComplaintDetail,
          ),
      },
      {
        path: 'privacy',
        data: { titleKey: 'content.privacy.title' },
        loadComponent: () =>
          import('./features/content/privacy-page/privacy-page').then((m) => m.PrivacyPage),
      },
    ],
  },

  {
    path: '**',
    data: { titleKey: 'notFound.title' },
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
