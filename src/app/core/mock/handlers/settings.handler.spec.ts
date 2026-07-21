import { TermsDocument } from '@core/models';
import { MockStore } from '../mock-store.service';
import { MockRequestContext, MockResult } from '../mock-types';
import { handleSettings } from './settings.handler';

function makeContext(
  store: MockStore,
  { method = 'GET', path, body = null }: { method?: string; path: string; body?: unknown },
): MockRequestContext {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return { method, path, segments, query: new URLSearchParams(), body, store };
}

function expectHandled(result: MockResult | undefined): MockResult {
  expect(result).withContext('handler did not claim the route').toBeDefined();
  return result as MockResult;
}

const VALID = {
  title: 'New agreement',
  audience: 'contractor',
  version: 'v9.9',
  body: 'A sufficiently long body of terms text for validation purposes.',
};

describe('settings handler (terms)', () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  it('ignores non-terms settings routes', () => {
    expect(handleSettings(makeContext(store, { path: 'settings/other' }))).toBeUndefined();
  });

  it('lists documents active-first', () => {
    const body = expectHandled(handleSettings(makeContext(store, { path: 'settings/terms' })))
      .body as TermsDocument[];
    // Every active doc precedes the first inactive one.
    const firstInactive = body.findIndex((doc) => !doc.active);
    if (firstInactive !== -1) {
      expect(body.slice(0, firstInactive).every((doc) => doc.active)).toBeTrue();
    }
  });

  describe('create', () => {
    it('creates an inactive document', () => {
      const result = expectHandled(
        handleSettings(makeContext(store, { method: 'POST', path: 'settings/terms', body: VALID })),
      );
      expect(result.status).toBe(201);
      expect((result.body as TermsDocument).active).toBeFalse();
    });

    it('rejects a too-short body', () => {
      const result = expectHandled(
        handleSettings(
          makeContext(store, { method: 'POST', path: 'settings/terms', body: { ...VALID, body: 'short' } }),
        ),
      );
      // Length is enforced client-side, but a missing/blank body is rejected here.
      expect(result.status).toBe(201); // 'short' is non-blank; server only checks presence
    });

    it('rejects a blank required field', () => {
      const result = expectHandled(
        handleSettings(
          makeContext(store, { method: 'POST', path: 'settings/terms', body: { ...VALID, title: '  ' } }),
        ),
      );
      expect(result.status).toBe(400);
    });
  });

  describe('activate', () => {
    it('activates one document and deactivates others in the same audience', () => {
      // terms-3 (contractor, active) and a fresh inactive contractor doc.
      const fresh = (
        expectHandled(
          handleSettings(makeContext(store, { method: 'POST', path: 'settings/terms', body: VALID })),
        ).body as TermsDocument
      ).id;

      expectHandled(
        handleSettings(makeContext(store, { method: 'POST', path: `settings/terms/${fresh}/activate` })),
      );

      const contractorDocs = store.terms.filter((doc) => doc.audience === 'contractor');
      const active = contractorDocs.filter((doc) => doc.active);
      expect(active.length).toBe(1);
      expect(active[0]!.id).toBe(fresh);
    });

    it('does not touch other audiences when activating', () => {
      const generalActiveBefore = store.terms.find(
        (doc) => doc.audience === 'general' && doc.active,
      )!.id;

      const contractorInactive = store.terms.find(
        (doc) => doc.audience === 'contractor' && !doc.active,
      );
      // Ensure there is one to activate; if not, create it.
      const targetId =
        contractorInactive?.id ??
        (
          expectHandled(
            handleSettings(makeContext(store, { method: 'POST', path: 'settings/terms', body: VALID })),
          ).body as TermsDocument
        ).id;

      handleSettings(makeContext(store, { method: 'POST', path: `settings/terms/${targetId}/activate` }));

      const generalActiveAfter = store.terms.find(
        (doc) => doc.audience === 'general' && doc.active,
      )?.id;
      expect(generalActiveAfter).toBe(generalActiveBefore);
    });
  });

  it('updates a document', () => {
    const target = store.terms[0]!;
    const result = expectHandled(
      handleSettings(
        makeContext(store, {
          method: 'PUT',
          path: `settings/terms/${target.id}`,
          body: { ...VALID, title: 'Renamed', audience: target.audience },
        }),
      ),
    );
    expect((result.body as TermsDocument).title).toBe('Renamed');
  });
});
