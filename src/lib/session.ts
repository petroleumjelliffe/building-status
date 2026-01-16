'use client';

/**
 * Client-side session management using localStorage
 * Stores authentication token with expiration
 */

export interface Session {
  token: string;
  expiresAt: number; // Unix timestamp
}

/**
 * Save session to localStorage
 * @param token - Session token from server
 * @param expiresInDays - Number of days until expiration (default: 7)
 */
export function saveSession(token: string, expiresInDays: number = 7): void {
  const session: Session = {
    token,
    expiresAt: Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)
  };
  localStorage.setItem('admin_session', JSON.stringify(session));
}

/**
 * Get session from localStorage
 * Returns null if no session or session is expired
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('admin_session');
  if (!stored) return null;

  try {
    const session: Session = JSON.parse(stored);

    // Check if expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to parse session:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_session');
  sessionStorage.removeItem('edit_mode');
}

/**
 * Get edit mode state from sessionStorage
 */
export function getEditMode(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('edit_mode') === 'true';
}

/**
 * Save edit mode state to sessionStorage
 */
export function setEditMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('edit_mode', enabled.toString());
}
