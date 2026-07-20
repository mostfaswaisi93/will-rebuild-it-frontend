import { TestBed } from '@angular/core/testing';
import { User } from '@core/models';
import { SessionStore, StoredSession } from './session-store.service';

/** Must match `STORAGE_KEY` in session-store.service.ts. */
const STORAGE_KEY = 'grp-session';

const DONOR: User = {
  id: 'u-donor-1',
  role: 'donor',
  firstName: 'Omar',
  lastName: 'Nasser',
  email: 'omar@example.com',
  phone: '+970111111',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const SESSION: StoredSession = { token: 'tok-123', user: DONOR };

describe('SessionStore', () => {
  const freshStore = (): SessionStore => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(SessionStore);
  };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('starts signed out when nothing has been stored', () => {
    const store = TestBed.inject(SessionStore);

    expect(store.isAuthenticated()).toBeFalse();
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(store.role()).toBeNull();
  });

  it('exposes the user, token and role after a session is set', () => {
    const store = TestBed.inject(SessionStore);

    store.setSession(SESSION);

    expect(store.isAuthenticated()).toBeTrue();
    expect(store.user()).toEqual(DONOR);
    expect(store.token()).toBe('tok-123');
    expect(store.role()).toBe('donor');
  });

  it('writes the session to localStorage so it can be restored later', () => {
    const store = TestBed.inject(SessionStore);

    store.setSession(SESSION);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(SESSION);
  });

  it('empties every signal and removes the stored copy on sign out', () => {
    const store = TestBed.inject(SessionStore);
    store.setSession(SESSION);

    store.clearSession();

    expect(store.isAuthenticated()).toBeFalse();
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(store.role()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('replaces the previous session when a new one is set', () => {
    const store = TestBed.inject(SessionStore);
    store.setSession(SESSION);

    const teamUser: User = { ...DONOR, id: 'u-team-1', role: 'team', teamId: 't-9' };
    store.setSession({ token: 'tok-456', user: teamUser });

    expect(store.token()).toBe('tok-456');
    expect(store.role()).toBe('team');
    expect(store.user()).toEqual(teamUser);
  });

  it('rehydrates the stored session when the app reloads', () => {
    TestBed.inject(SessionStore).setSession(SESSION);

    const reloaded = freshStore();

    expect(reloaded.isAuthenticated()).toBeTrue();
    expect(reloaded.user()).toEqual(DONOR);
    expect(reloaded.token()).toBe('tok-123');
    expect(reloaded.role()).toBe('donor');
  });

  it('stays signed out after a reload that follows a sign out', () => {
    const store = TestBed.inject(SessionStore);
    store.setSession(SESSION);
    store.clearSession();

    expect(freshStore().isAuthenticated()).toBeFalse();
  });

  it('degrades to signed out instead of throwing on malformed stored json', () => {
    localStorage.setItem(STORAGE_KEY, '{"token": "tok", "user"');

    let store!: SessionStore;
    expect(() => (store = freshStore())).not.toThrow();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.user()).toBeNull();
    expect(store.role()).toBeNull();
  });

  it('degrades to signed out when the stored value is the literal null', () => {
    localStorage.setItem(STORAGE_KEY, 'null');

    const store = freshStore();

    expect(store.isAuthenticated()).toBeFalse();
    expect(store.role()).toBeNull();
  });

  it('degrades to signed out when the stored value is an empty string', () => {
    localStorage.setItem(STORAGE_KEY, '');

    const store = freshStore();

    expect(store.isAuthenticated()).toBeFalse();
  });
});
