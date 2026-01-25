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

interface SessionData {
  tokens: string[];
  lastUpdated: number;
}

// Load sessions from file on module initialization
function loadSessions(): Set<string> {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data: SessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
      // Only load sessions less than 7 days old
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (data.lastUpdated > sevenDaysAgo) {
        console.log('[auth] Loaded', data.tokens.length, 'sessions from file');
        return new Set(data.tokens);
      }
    }
  } catch (error) {
    console.error('[auth] Error loading sessions:', error);
  }
  return new Set<string>();
}

// Save sessions to file
function saveSessions(sessions: Set<string>): void {
  try {
    const data: SessionData = {
      tokens: Array.from(sessions),
      lastUpdated: Date.now(),
    };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
    console.log('[auth] Saved', data.tokens.length, 'sessions to file');
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
 */
export function validateSessionToken(token: string | null | undefined): boolean {
  if (!token) {
    console.log('[auth] validateSessionToken: No token provided');
    return false;
  }

  const isValid = activeSessions.has(token);
  console.log('[auth] validateSessionToken:', {
    tokenPreview: token.substring(0, 8) + '...',
    isValid,
    activeSessionsCount: activeSessions.size,
  });

  return isValid;
}

/**
 * Verify admin token (alias for validateSessionToken)
 * Used by API endpoints for consistency
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  return validateSessionToken(token);
}

/**
 * Create a new session after password verification
 * Returns session token or null if password invalid
 */
export async function createSession(password: string): Promise<string | null> {
  const isValid = await verifyPassword(password);
  if (!isValid) {
    console.log('[auth] createSession: Invalid password');
    return null;
  }

  const token = generateSessionToken();
  activeSessions.add(token);
  saveSessions(activeSessions); // Persist to file

  console.log('[auth] createSession: New session created', {
    tokenPreview: token.substring(0, 8) + '...',
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
