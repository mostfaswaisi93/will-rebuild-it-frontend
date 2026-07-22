import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { delay, of, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { MockStore } from '../mock/mock-store.service';
import { MockRequestContext } from '../mock/mock-types';
import { handleAuth } from '../mock/handlers/auth.handler';
import { handleDashboard } from '../mock/handlers/dashboard.handler';
import { handleMaster } from '../mock/handlers/master.handler';
import { handleRequests } from '../mock/handlers/requests.handler';
import { handleWorkRequests } from '../mock/handlers/work-requests.handler';
import { handleWorkOrders } from '../mock/handlers/work-orders.handler';
import { handleStatements } from '../mock/handlers/statements.handler';
import { handlePricebook } from '../mock/handlers/pricebook.handler';
import { handleBeneficiaries } from '../mock/handlers/beneficiaries.handler';
import { handleSuppliers } from '../mock/handlers/suppliers.handler';
import { handleInventory } from '../mock/handlers/inventory.handler';
import { handleEquipment } from '../mock/handlers/equipment.handler';
import { handleDisbursements } from '../mock/handlers/disbursements.handler';
import { handleSettings } from '../mock/handlers/settings.handler';
import { handleScorecards } from '../mock/handlers/scorecards.handler';
import { handleStaff } from '../mock/handlers/staff.handler';
import { handleCampaigns } from '../mock/handlers/campaigns.handler';
import { handleLogs } from '../mock/handlers/logs.handler';
import { handleMonitoring } from '../mock/handlers/monitoring.handler';
import { handleSubscriptions } from '../mock/handlers/subscriptions.handler';
import { handleShipments } from '../mock/handlers/shipments.handler';
import { handlePriceList } from '../mock/handlers/price-list.handler';
import { handleProjects } from '../mock/handlers/projects.handler';
import { handleTeams } from '../mock/handlers/teams.handler';
import { handleEstimates } from '../mock/handlers/estimates.handler';
import { handleFunding } from '../mock/handlers/funding.handler';
import { handleDonations } from '../mock/handlers/donations.handler';
import { handleSupport } from '../mock/handlers/support.handler';
import { handleComplaints } from '../mock/handlers/complaints.handler';
import { handleNotifications } from '../mock/handlers/notifications.handler';
import { handleProfile } from '../mock/handlers/profile.handler';
import { handleTeamWorkspace } from '../mock/handlers/team-workspace.handler';
import { handleReviews } from '../mock/handlers/reviews.handler';

const handlers = [
  handleAuth,
  handleDashboard,
  handleMaster,
  handleRequests,
  handleWorkRequests,
  handleWorkOrders,
  handleStatements,
  handlePricebook,
  handleBeneficiaries,
  handleSuppliers,
  handleInventory,
  handleEquipment,
  handleDisbursements,
  handleSettings,
  handleScorecards,
  handleStaff,
  handleCampaigns,
  handleLogs,
  handleMonitoring,
  handleSubscriptions,
  handleShipments,
  handlePriceList,
  handleProjects,
  handleTeams,
  handleEstimates,
  handleFunding,
  handleDonations,
  handleSupport,
  handleComplaints,
  handleNotifications,
  handleProfile,
  handleTeamWorkspace,
  handleReviews,
];

/**
 * Stands in for a real backend. Never calls `next()`, so it short-circuits
 * before any real network/SSR fetch happens — safe on the server by
 * construction. Keep this registered last so auth/error interceptors still
 * wrap the synthetic response on its way back.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockApi || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const store = inject(MockStore);
  const platformId = inject(PLATFORM_ID);

  // `urlWithParams`, not `url`: HttpClient keeps `params` OUT of `req.url`, so
  // reading `url` here would drop every query param (filters, paging, lang)
  // and silently serve unfiltered defaults.
  const rawPath = req.urlWithParams.slice(environment.apiUrl.length) || '/';
  const [pathname, queryString] = rawPath.split('?');
  const segments = pathname.split('/').filter(Boolean);

  const ctx: MockRequestContext = {
    method: req.method,
    path: pathname,
    segments,
    query: new URLSearchParams(queryString ?? ''),
    body: req.body,
    store,
  };

  const result = handlers.reduce<ReturnType<(typeof handlers)[number]>>(
    (found, handle) => found ?? handle(ctx),
    undefined,
  ) ?? { status: 404, body: { message: `No mock handler for ${req.method} ${pathname}` } };

  const latency = isPlatformServer(platformId) ? 0 : 250 + Math.round(Math.random() * 200);

  if (result.status >= 200 && result.status < 300) {
    return of(new HttpResponse({ status: result.status, body: result.body, url: req.url })).pipe(delay(latency));
  }

  return throwError(
    () => new HttpErrorResponse({ status: result.status, error: result.body, url: req.url }),
  ).pipe(delay(latency));
};
