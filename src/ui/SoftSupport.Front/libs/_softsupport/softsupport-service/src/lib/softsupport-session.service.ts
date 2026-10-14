import { computed, Injectable, signal } from '@angular/core';
import { AuthUser, LoginResult } from '@softsupport/models';

const TOKEN_KEY = 'softsupport.token';
const USER_KEY = 'softsupport.user';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readUser(): AuthUser | null {
  const raw = readStorage(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class SoftSupportSessionService {
  private readonly tokenState = signal<string | null>(readStorage(TOKEN_KEY));
  private readonly userState = signal<AuthUser | null>(readUser());

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly roleName = computed(() => this.userState()?.roleName ?? null);
  readonly displayName = computed(() => {
    const user = this.userState();
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';
  });

  isAuthenticated(): boolean {
    const token = this.tokenState();
    if (!token || !this.userState()) {
      return false;
    }
    const expiry = tokenExpiry(token);
    return expiry === null || expiry > Date.now();
  }

  hasRole(roles: readonly string[]): boolean {
    const role = this.roleName();
    return !!role && roles.includes(role);
  }

  open(result: LoginResult): void {
    try {
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    } catch {
      // Stockage indisponible (navigation privée stricte) : la session vit en mémoire.
    }
    this.tokenState.set(result.token);
    this.userState.set(result.user);
  }

  updateValidator(isValidator: boolean): void {
    const user = this.userState();
    if (!user || user.isValidator === isValidator) {
      return;
    }
    this.persist({ ...user, isValidator });
  }

  private persist(next: AuthUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      // ignoré : voir open()
    }
    this.userState.set(next);
  }

  close(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignoré : voir open()
    }
    this.tokenState.set(null);
    this.userState.set(null);
  }
}
