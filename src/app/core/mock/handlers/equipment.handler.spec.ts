import { Equipment, PagedResult } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { EquipmentSummary } from '@core/api/equipment-api.service';
import { handleEquipment } from './equipment.handler';

function makeContext(
  store: MockStore,
  { method = 'GET', path, query = {}, body = null }: {
    method?: string;
    path: string;
    query?: Record<string, string>;
    body?: unknown;
  },
): MockRequestContext {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return { method, path, segments, query: new URLSearchParams(query), body, store };
}

function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler did not claim the route').toBeDefined();
  return result as MockResult;
}

describe('equipment handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores unrelated roots', () => {
    expect(handleEquipment(makeContext(store, { path: 'inventory' }))).toBeUndefined();
  });

  it('returns the full fleet for the schedule', () => {
    const result = expectHandled(handleEquipment(makeContext(store, { path: 'equipment/schedule' })));
    expect((result.body as Equipment[]).length).toBe(store.equipment.length);
  });

  it('summarises availability', () => {
    const body = expectHandled(
      handleEquipment(makeContext(store, { path: 'equipment', query: { pageSize: '50' } })),
    ).body as PagedResult<Equipment> & { summary: EquipmentSummary };
    expect(body.summary.available).toBe(store.equipment.filter((e) => e.status === 'available').length);
    expect(body.summary.unavailable).toBe(
      store.equipment.filter((e) => e.status === 'maintenance' || e.status === 'outOfService').length,
    );
  });

  describe('bookings', () => {
    it('adds a booking and marks an available machine booked', () => {
      // eq-2 is available with no bookings.
      const result = expectHandled(
        handleEquipment(
          makeContext(store, {
            method: 'POST',
            path: 'equipment/eq-2/bookings',
            body: {
              from: '2026-08-01T00:00:00.000Z',
              to: '2026-08-03T00:00:00.000Z',
              projectTitle: 'Test job',
            },
          }),
        ),
      );
      const updated = result.body as Equipment;
      expect(updated.bookings.length).toBe(1);
      expect(updated.status).toBe('booked');
    });

    it('rejects a clashing booking', () => {
      // eq-1 is already booked 2026-07-22 → 2026-07-26.
      const result = expectHandled(
        handleEquipment(
          makeContext(store, {
            method: 'POST',
            path: 'equipment/eq-1/bookings',
            body: {
              from: '2026-07-24T00:00:00.000Z',
              to: '2026-07-25T00:00:00.000Z',
              projectTitle: 'Overlap',
            },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });

    it('refuses to book a machine in maintenance', () => {
      // eq-4 is in maintenance.
      const result = expectHandled(
        handleEquipment(
          makeContext(store, {
            method: 'POST',
            path: 'equipment/eq-4/bookings',
            body: { from: '2026-08-01', to: '2026-08-02', projectTitle: 'X' },
          }),
        ),
      );
      expect(result.status).toBe(400);
    });
  });

  describe('problems', () => {
    it('takes a machine out of service on a critical fault', () => {
      const result = expectHandled(
        handleEquipment(
          makeContext(store, {
            method: 'POST',
            path: 'equipment/eq-2/problems',
            body: { severity: 'critical', description: 'Hydraulic ram failure, unsafe to operate.' },
          }),
        ),
      );
      const updated = result.body as Equipment;
      expect(updated.status).toBe('outOfService');
      expect(updated.problems[0]!.severity).toBe('critical');
    });

    it('resolves a problem', () => {
      const openProblem = store.equipment.find((e) => e.id === 'eq-4')!.problems[0]!;
      const result = expectHandled(
        handleEquipment(
          makeContext(store, {
            method: 'POST',
            path: `equipment/eq-4/problems/${openProblem.id}/resolve`,
          }),
        ),
      );
      const updated = result.body as Equipment;
      expect(updated.problems.find((p) => p.id === openProblem.id)?.resolvedAt).toBeTruthy();
    });
  });
});
