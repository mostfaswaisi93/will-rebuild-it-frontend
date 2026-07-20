import { PROJECT_PHASE_KEYS, Project, ReconstructionRequest } from '@core/models';
import { MockHandler, ok } from '../mock-types';

/** Statuses that mean "this project is still being worked on". */
const LIVE_PROJECT_STATUSES = ['active', 'onHold'];
/** Requests still needing an operator decision. */
const OPEN_REQUEST_STATUSES = ['new', 'underReview', 'matched'];

function toProjectRow(project: Project) {
  return {
    id: project.id,
    projectNumber: project.projectNumber,
    title: project.title,
    status: project.status,
    currentPhaseKey: project.currentPhaseKey,
    overallCompletionPercent: project.overallCompletionPercent,
    teamName: project.teamName,
  };
}

function toRequestRow(request: ReconstructionRequest) {
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    governorate: request.address.governorate,
    severity: request.severity,
    status: request.status,
    createdAt: request.createdAt,
  };
}

/** Newest first, capped — a dashboard list is a prompt to act, not a report. */
function newestFirst<T extends { createdAt: string }>(items: T[], limit: number): T[] {
  return [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export const handleDashboard: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'dashboard' || ctx.method !== 'GET') {
    return undefined;
  }

  if (ctx.segments[1] === 'admin') {
    const contractors = ctx.store.users.filter((user) => user.role === 'contractor');

    // Sum across every disbursement rather than trusting a stored total —
    // the two can drift, and the ledger is the source of truth.
    const disbursedTotal = ctx.store.funding.reduce(
      (sum, funding) =>
        sum +
        funding.disbursements
          .filter((disbursement) => !disbursement.isVoided && !disbursement.isRefunded)
          .reduce((inner, disbursement) => inner + disbursement.amount, 0),
      0,
    );

    const outstandingTotal = ctx.store.funding.reduce(
      (sum, funding) => sum + funding.outstandingAmount,
      0,
    );

    const projectsByPhase = PROJECT_PHASE_KEYS.map((phaseKey) => ({
      phaseKey,
      count: ctx.store.projects.filter(
        (project) =>
          project.currentPhaseKey === phaseKey && LIVE_PROJECT_STATUSES.includes(project.status),
      ).length,
    }));

    return ok({
      activeProjects: ctx.store.projects.filter((project) =>
        LIVE_PROJECT_STATUSES.includes(project.status),
      ).length,
      openRequests: ctx.store.requests.filter((request) =>
        OPEN_REQUEST_STATUSES.includes(request.status),
      ).length,
      registeredContractors: contractors.length,
      pendingContractors: contractors.filter((user) => user.registrationComplete === false).length,
      disbursedTotal,
      outstandingTotal,
      currency: 'USD',
      projectsByPhase,
      recentRequests: newestFirst(ctx.store.requests, 5).map(toRequestRow),
    });
  }

  if (ctx.segments[1] === 'contractor') {
    // No contractor-to-project assignment exists in the seeded data yet, so
    // every live project is shown. Narrow this to the signed-in contractor's
    // team once assignment is modelled.
    const live = ctx.store.projects.filter((project) =>
      LIVE_PROJECT_STATUSES.includes(project.status),
    );

    return ok({
      assignedProjects: live.length,
      pendingEstimates: ctx.store.estimates.filter(
        (estimate) => estimate.status === 'pendingApproval',
      ).length,
      openRequests: ctx.store.requests.filter((request) =>
        OPEN_REQUEST_STATUSES.includes(request.status),
      ).length,
      outstandingAmount: ctx.store.funding.reduce(
        (sum, funding) => sum + funding.outstandingAmount,
        0,
      ),
      currency: 'USD',
      activeProjects: newestFirst(live, 5).map(toProjectRow),
    });
  }

  if (ctx.segments[1] === 'staff') {
    const live = ctx.store.projects.filter((project) =>
      LIVE_PROJECT_STATUSES.includes(project.status),
    );

    return ok({
      assignedProjects: live.length,
      phasesInProgress: live.reduce(
        (sum, project) =>
          sum + project.phases.filter((phase) => phase.status === 'inProgress').length,
        0,
      ),
      activeProjects: newestFirst(live, 5).map(toProjectRow),
    });
  }

  return undefined;
};
