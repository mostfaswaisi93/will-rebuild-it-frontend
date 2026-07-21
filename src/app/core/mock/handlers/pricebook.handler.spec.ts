import { PagedResult, PricebookItem } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handlePricebook } from './pricebook.handler';

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

const VALID = {
  code: 'MAT-NEW-01',
  category: 'materials',
  description: 'New material line',
  unit: 'm³',
  unitRate: 42,
};

describe('pricebook handler', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores routes outside /pricebook', () => {
    expect(handlePricebook(makeContext(store, { path: 'estimates' }))).toBeUndefined();
  });

  describe('GET /pricebook', () => {
    it('filters by category', () => {
      const body = expectHandled(
        handlePricebook(makeContext(store, { path: 'pricebook', query: { category: 'labor', pageSize: '50' } })),
      ).body as PagedResult<PricebookItem>;
      expect(body.items.every((item) => item.category === 'labor')).toBeTrue();
    });

    it('active=active hides deactivated items', () => {
      const body = expectHandled(
        handlePricebook(makeContext(store, { path: 'pricebook', query: { active: 'active', pageSize: '50' } })),
      ).body as PagedResult<PricebookItem>;
      expect(body.items.every((item) => item.active)).toBeTrue();
      // The fixture seeds one inactive item, so filtering must reduce the count.
      expect(body.totalCount).toBeLessThan(store.pricebook.length);
    });

    it('searches code and description', () => {
      const body = expectHandled(
        handlePricebook(makeContext(store, { path: 'pricebook', query: { searchKey: 'excavator' } })),
      ).body as PagedResult<PricebookItem>;
      expect(body.items.some((item) => item.code === 'EQP-EXC-01')).toBeTrue();
    });
  });

  describe('POST /pricebook', () => {
    it('creates an item and prepends it', () => {
      const before = store.pricebook.length;
      const result = expectHandled(
        handlePricebook(makeContext(store, { method: 'POST', path: 'pricebook', body: VALID })),
      );
      expect(result.status).toBe(201);
      expect(store.pricebook.length).toBe(before + 1);
      expect((result.body as PricebookItem).active).toBeTrue();
    });

    it('rejects a duplicate code (case-insensitive)', () => {
      const result = expectHandled(
        handlePricebook(
          makeContext(store, { method: 'POST', path: 'pricebook', body: { ...VALID, code: 'mat-conc-01' } }),
        ),
      );
      expect(result.status).toBe(409);
    });

    it('rejects a negative rate', () => {
      const result = expectHandled(
        handlePricebook(makeContext(store, { method: 'POST', path: 'pricebook', body: { ...VALID, unitRate: -1 } })),
      );
      expect(result.status).toBe(400);
    });
  });

  describe('PUT /pricebook/:id', () => {
    it('updates fields', () => {
      const target = store.pricebook[0]!;
      const result = expectHandled(
        handlePricebook(
          makeContext(store, {
            method: 'PUT',
            path: `pricebook/${target.id}`,
            body: { ...VALID, code: target.code, unitRate: 999 },
          }),
        ),
      );
      expect((result.body as PricebookItem).unitRate).toBe(999);
    });

    it('lets an item keep its own code', () => {
      const target = store.pricebook[0]!;
      const result = expectHandled(
        handlePricebook(
          makeContext(store, {
            method: 'PUT',
            path: `pricebook/${target.id}`,
            body: { ...VALID, code: target.code },
          }),
        ),
      );
      // Reusing the item's *own* code must not read as a duplicate.
      expect(result.status).toBe(200);
    });

    it('rejects taking another item\'s code', () => {
      const [a, b] = store.pricebook;
      const result = expectHandled(
        handlePricebook(
          makeContext(store, { method: 'PUT', path: `pricebook/${a!.id}`, body: { ...VALID, code: b!.code } }),
        ),
      );
      expect(result.status).toBe(409);
    });
  });

  describe('POST /pricebook/:id/active', () => {
    it('toggles the active flag', () => {
      const target = store.pricebook.find((item) => item.active)!;
      const result = expectHandled(
        handlePricebook(
          makeContext(store, { method: 'POST', path: `pricebook/${target.id}/active`, body: { active: false } }),
        ),
      );
      expect((result.body as PricebookItem).active).toBeFalse();
    });
  });
});
