import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
 * In-memory session store (resets on server restart)
 * For production, use Redis or a database
 */
const activeSessions = new Set<string>();

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
  if (!token) return false;
  return activeSessions.has(token);
}

/**
 * Create a new session after password verification
 * Returns session token or null if password invalid
 */
export async function createSession(password: string): Promise<string | null> {
  const isValid = await verifyPassword(password);
  if (!isValid) return null;

  const token = generateSessionToken();
  activeSessions.add(token);

  return token;
}

/**
 * Invalidate a session token
 */
export function revokeSession(token: string): void {
  activeSessions.delete(token);
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
