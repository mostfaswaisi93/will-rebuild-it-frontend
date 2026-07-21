import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { AdminDashboardDto, ContractorDashboardDto, StaffDashboardDto } from '@core/api/dto/dashboard.dto';
import { handleDashboard } from './dashboard.handler';

function makeContext(store: MockStore, path: string, method = 'GET'): MockRequestContext {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return { method, path, segments, query: new URLSearchParams(), body: null, store };
}

function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler did not claim the route').toBeDefined();
  return result as MockResult;
}

describe('dashboard handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /dashboard', () => {
    expect(handleDashboard(makeContext(store, 'projects'))).toBeUndefined();
  });

  it('ignores non-GET methods', () => {
    expect(handleDashboard(makeContext(store, 'dashboard/admin', 'POST'))).toBeUndefined();
  });

  describe('admin', () => {
    function load(): AdminDashboardDto {
      return expectHandled(handleDashboard(makeContext(store, 'dashboard/admin')))
        .body as AdminDashboardDto;
    }

    it('counts only live projects as active', () => {
      const expected = store.projects.filter(
        (project) => project.status === 'active' || project.status === 'onHold',
      ).length;
      expect(load().activeProjects).toBe(expected);
    });

    it('counts contractors and flags those still onboarding', () => {
      const data = load();
      expect(data.registeredContractors).toBe(
        store.users.filter((user) => user.role === 'contractor').length,
      );
      // `pending@example.com` is seeded with an incomplete registration.
      expect(data.pendingContractors).toBeGreaterThan(0);
    });

    it('sums disbursements from the ledger, excluding voided and refunded ones', () => {
      const funding = store.funding[0];
      expect(funding).withContext('fixture needs at least one funding record').toBeDefined();

      const before = load().disbursedTotal;
      funding!.disbursements.push({
        id: 'disbursement-voided',
        fundingId: funding!.id,
        amount: 5000,
        funderName: 'Test',
        disbursedAt: '2026-01-01T00:00:00.000Z',
        isVoided: true,
        isRefunded: false,
      });

      // A voided disbursement must not inflate the headline figure.
      expect(load().disbursedTotal).toBe(before);
    });

    it('returns at most five recent requests, newest first', () => {
      const rows = load().recentRequests;
      expect(rows.length).toBeLessThanOrEqual(5);
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i - 1]!.createdAt >= rows[i]!.createdAt).toBeTrue();
      }
    });

    it('reports a count for every reconstruction phase', () => {
      // The page filters empty phases out; the API stays complete so the
      // caller decides what to hide.
      expect(load().projectsByPhase.length).toBe(7);
    });
  });

  describe('contractor', () => {
    it('reports pending estimates and outstanding funding', () => {
      const data = expectHandled(handleDashboard(makeContext(store, 'dashboard/contractor')))
        .body as ContractorDashboardDto;

      expect(data.pendingEstimates).toBe(
        store.estimates.filter((estimate) => estimate.status === 'pendingApproval').length,
      );
      expect(data.outstandingAmount).toBe(
        store.funding.reduce((sum, funding) => sum + funding.outstandingAmount, 0),
      );
      expect(data.activeProjects.length).toBeLessThanOrEqual(5);
    });
  });

  describe('staff', () => {
    it('counts phases currently in progress across live projects', () => {
      const data = expectHandled(handleDashboard(makeContext(store, 'dashboard/staff')))
        .body as StaffDashboardDto;

      const expected = store.projects
        .filter((project) => project.status === 'active' || project.status === 'onHold')
        .reduce(
          (sum, project) =>
            sum + project.phases.filter((phase) => phase.status === 'inProgress').length,
          0,
        );
      expect(data.phasesInProgress).toBe(expected);
    });
  });
});
