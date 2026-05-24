import type { User } from '@/types';

const SESSION_KEY = 'equilino-session';

export interface StoredSession {
  user: User;
  accessToken: string;
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(user: User, accessToken: string): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, accessToken }));
  } catch {}
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function updateStoredUser(patch: Partial<User>): void {
  const session = getStoredSession();
  if (!session) return;
  setStoredSession({ ...session.user, ...patch }, session.accessToken);
}
