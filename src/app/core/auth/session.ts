import { Injectable, computed, signal } from '@angular/core';

import type { User } from './api/model';

export type { User, Role } from './api/model';

interface StoredSession {
  token: string;
  user: User;
}

const STORAGE_KEY = 'punchy.session';

function read(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function write(session: StoredSession | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: the session lasts until the tab closes.
  }
}

/**
 * The signed-in user and their token, persisted so a reload keeps the session. Any feature may
 * end it; only the login feature starts it.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly state = signal<StoredSession | null>(read());

  readonly user = computed(() => this.state()?.user ?? null);
  readonly token = computed(() => this.state()?.token ?? null);
  readonly role = computed(() => this.state()?.user.role ?? null);
  readonly isSignedIn = computed(() => this.state() !== null);

  start(token: string, user: User): void {
    this.set({ token, user });
  }

  /** Replaces the stored user after the profile changes. */
  updateUser(user: User): void {
    const current = this.state();
    if (current) this.set({ ...current, user });
  }

  end(): void {
    this.set(null);
  }

  private set(session: StoredSession | null) {
    write(session);
    this.state.set(session);
  }
}
