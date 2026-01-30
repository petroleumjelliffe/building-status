import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Verify a password against the stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.EDITOR_PASSWORD_HASH;

  if (!hash) {
    console.error('EDITOR_PASSWORD_HASH environment variable is not set');
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Session storage with file persistence (for development)
 * For production, use Redis or a database
 */
const SESSION_FILE = path.join(process.cwd(), '.sessions.json');

interface SessionInfo {
  propertyId: number | null; // null = global session (backward compat)
  createdAt: number;
}

interface SessionData {
  sessions: Record<string, SessionInfo>;
  lastUpdated: number;
}

// Legacy format for backward compatibility
interface LegacySessionData {
  tokens: string[];
  lastUpdated: number;
}

// Load sessions from file on module initialization
function loadSessions(): Map<string, SessionInfo> {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const rawData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      // Handle legacy format (array of tokens)
      if (Array.isArray(rawData.tokens)) {
        const legacyData = rawData as LegacySessionData;
        if (legacyData.lastUpdated > sevenDaysAgo) {
          console.log('[auth] Migrating', legacyData.tokens.length, 'legacy sessions');
          const sessions = new Map<string, SessionInfo>();
          for (const token of legacyData.tokens) {
            sessions.set(token, { propertyId: null, createdAt: legacyData.lastUpdated });
          }
          return sessions;
        }
      } else if (rawData.sessions) {
        // New format with session info
        const data = rawData as SessionData;
        if (data.lastUpdated > sevenDaysAgo) {
          console.log('[auth] Loaded', Object.keys(data.sessions).length, 'sessions from file');
          return new Map(Object.entries(data.sessions));
        }
      }
    }
  } catch (error) {
    console.error('[auth] Error loading sessions:', error);
  }
  return new Map<string, SessionInfo>();
}

// Save sessions to file
function saveSessions(sessions: Map<string, SessionInfo>): void {
  try {
    const data: SessionData = {
      sessions: Object.fromEntries(sessions),
      lastUpdated: Date.now(),
    };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
    console.log('[auth] Saved', sessions.size, 'sessions to file');
  } catch (error) {
    console.error('[auth] Error saving sessions:', error);
  }
}

const activeSessions = loadSessions();

/**
 * Generate a cryptographically random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a session token
 * @param token - The session token to validate
 * @param propertyId - Optional property ID to verify the session is bound to
 */
export function validateSessionToken(
  token: string | null | undefined,
  propertyId?: number
): boolean {
  if (!token) {
    console.log('[auth] validateSessionToken: No token provided');
    return false;
  }

  const sessionInfo = activeSessions.get(token);
  if (!sessionInfo) {
    console.log('[auth] validateSessionToken:', {
      tokenPreview: token.substring(0, 8) + '...',
      isValid: false,
      activeSessionsCount: activeSessions.size,
    });
    return false;
  }

  // If propertyId is specified, verify session is bound to that property
  // Sessions with null propertyId (legacy/global) are valid for any property
  if (propertyId !== undefined && sessionInfo.propertyId !== null) {
    if (sessionInfo.propertyId !== propertyId) {
      console.log('[auth] validateSessionToken: Property mismatch', {
        tokenPreview: token.substring(0, 8) + '...',
        sessionPropertyId: sessionInfo.propertyId,
        requestedPropertyId: propertyId,
      });
      return false;
    }
  }

  console.log('[auth] validateSessionToken:', {
    tokenPreview: token.substring(0, 8) + '...',
    isValid: true,
    propertyId: sessionInfo.propertyId,
    activeSessionsCount: activeSessions.size,
  });

  return true;
}

/**
 * Verify admin token (alias for validateSessionToken)
 * Used by API endpoints for consistency
 */
export function verifyAdminToken(
  token: string | null | undefined,
  propertyId?: number
): boolean {
  return validateSessionToken(token, propertyId);
}

/**
 * Get the property ID bound to a session token
 */
export function getSessionPropertyId(token: string | null | undefined): number | null {
  if (!token) return null;
  const sessionInfo = activeSessions.get(token);
  return sessionInfo?.propertyId ?? null;
}

/**
 * Create a new session after password verification
 * @param password - The password to verify
 * @param propertyId - Optional property ID to bind session to
 * Returns session token or null if password invalid
 */
export async function createSession(
  password: string,
  propertyId?: number
): Promise<string | null> {
  const isValid = await verifyPassword(password);
  if (!isValid) {
    console.log('[auth] createSession: Invalid password');
    return null;
  }

  const token = generateSessionToken();
  activeSessions.set(token, {
    propertyId: propertyId ?? null,
    createdAt: Date.now(),
  });
  saveSessions(activeSessions); // Persist to file

  console.log('[auth] createSession: New session created', {
    tokenPreview: token.substring(0, 8) + '...',
    propertyId: propertyId ?? null,
    activeSessionsCount: activeSessions.size,
  });

  return token;
}

/**
 * Invalidate a session token
 */
export function revokeSession(token: string): void {
  activeSessions.delete(token);
  saveSessions(activeSessions); // Persist to file
  console.log('[auth] revokeSession: Session revoked', {
    tokenPreview: token.substring(0, 8) + '...',
    activeSessionsCount: activeSessions.size,
  });
}

/**
 * Generate a password hash (for setup/testing)
 * Usage: node -e "require('./src/lib/auth').generatePasswordHash('your-password')"
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Example usage in Node REPL:
// const bcrypt = require('bcryptjs');
// bcrypt.hash('mypassword', 10).then(console.log);
