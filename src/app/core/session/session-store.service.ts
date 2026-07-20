import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '@core/models';

const STORAGE_KEY = 'wri-session';

export interface StoredSession {
  token: string;
  user: User;
}

/** Single source of session truth (REBUILD_PROMPT §4.3) — no duplicate localStorage/sessionStorage state. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<StoredSession | null>(this.readStoredSession());

  readonly user = computed(() => this.state()?.user ?? null);
  readonly token = computed(() => this.state()?.token ?? null);
  // Optional-chain the whole path: a malformed persisted session must never throw here.
  readonly role = computed<UserRole | null>(() => this.state()?.user?.role ?? null);
  readonly isAuthenticated = computed(() => this.state() !== null);

  setSession(session: StoredSession): void {
    this.state.set(session);
    this.persist(session);
  }

  clearSession(): void {
    this.state.set(null);
    this.persist(null);
  }

  private persist(session: StoredSession | null): void {
    if (!this.isBrowser) {
      return;
    }
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private readStoredSession(): StoredSession | null {
    if (!this.isBrowser) {
      return null;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      // Valid JSON is not the same as a valid session: `{"token":"x"}` parses
      // fine but would otherwise present as signed-in with no user. Anything
      // that fails the shape check is treated as signed-out.
      return isStoredSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function isStoredSession(value: unknown): value is StoredSession {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<StoredSession>;
  return (
    typeof candidate.token === 'string' &&
    candidate.token.length > 0 &&
    candidate.user !== null &&
    typeof candidate.user === 'object' &&
    typeof candidate.user.id === 'string' &&
    typeof candidate.user.role === 'string'
  );
}
