import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session-store.service';

const STORAGE_KEY = 'wri-session';

/**
 * Guards a real defect: `JSON.parse` succeeding is not the same as the stored
 * value being a usable session. `{"token":"x"}` (no user) parsed cleanly, so
 * the store reported `isAuthenticated() === true` and then threw a TypeError
 * the moment anything read `role()`. Structurally-invalid sessions must be
 * treated as signed-out.
 */
describe('SessionStore — malformed persisted session', () => {
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  function storeAndRead(raw: string): SessionStore {
    localStorage.setItem(STORAGE_KEY, raw);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(SessionStore);
  }

  it('treats a token-only session as signed out', () => {
    const store = storeAndRead('{"token":"abc"}');

    expect(store.isAuthenticated()).withContext('must not appear signed in').toBeFalse();
    expect(() => store.role()).not.toThrow();
    expect(store.role()).toBeNull();
    expect(store.user()).toBeNull();
  });

  it('treats a session whose user lacks a role as signed out', () => {
    const store = storeAndRead('{"token":"abc","user":{"id":"u1"}}');

    expect(store.isAuthenticated()).toBeFalse();
    expect(store.role()).toBeNull();
  });

  it('treats an empty token as signed out', () => {
    const store = storeAndRead('{"token":"","user":{"id":"u1","role":"beneficiary"}}');

    expect(store.isAuthenticated()).toBeFalse();
  });

  it('treats a JSON primitive as signed out', () => {
    const store = storeAndRead('"just a string"');

    expect(store.isAuthenticated()).toBeFalse();
    expect(store.role()).toBeNull();
  });

  it('still accepts a well-formed session', () => {
    const store = storeAndRead(
      '{"token":"abc","user":{"id":"u1","role":"beneficiary","firstName":"Y","lastName":"N","email":"y@e.com","phone":"+970","createdAt":"2026-01-01T00:00:00.000Z"}}',
    );

    expect(store.isAuthenticated()).toBeTrue();
    expect(store.role()).toBe('beneficiary');
    expect(store.user()?.id).toBe('u1');
  });
});
