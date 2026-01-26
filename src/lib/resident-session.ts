import { randomBytes } from 'crypto';
import { db } from './db';
import { residentSessions } from './schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Generate a session token
 * @returns 43-character URL-safe string
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create a new resident session
 * @param propertyId - Database ID of the property
 * @param accessTokenId - Database ID of the access token used
 * @returns Session token and expiration date
 */
export async function createResidentSession(
  propertyId: number,
  accessTokenId: number
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = generateSessionToken();

  // 90-day expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await db.insert(residentSessions).values({
    propertyId,
    accessTokenId,
    sessionToken,
    expiresAt,
    lastSeenAt: new Date(),
  });

  return { sessionToken, expiresAt };
}

/**
 * Validate a resident session token
 * @param sessionToken - The session token to validate
 * @param propertyHash - The property hash from the URL (for verification)
 * @returns Session info if valid, null if invalid
 */
export async function validateResidentSession(
  sessionToken: string
): Promise<{
  propertyId: number;
  sessionId: number;
  expiresAt: Date;
} | null> {
  const [session] = await db
    .select({
      id: residentSessions.id,
      propertyId: residentSessions.propertyId,
      expiresAt: residentSessions.expiresAt,
    })
    .from(residentSessions)
    .where(
      and(
        eq(residentSessions.sessionToken, sessionToken),
        gte(residentSessions.expiresAt, new Date())
      )
    );

  if (!session) {
    return null;
  }

  // Update last seen timestamp
  await db
    .update(residentSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(residentSessions.id, session.id));

  return {
    propertyId: session.propertyId,
    sessionId: session.id,
    expiresAt: session.expiresAt,
  };
}

/**
 * Invalidate a resident session (logout)
 * @param sessionToken - The session token to invalidate
 */
export async function invalidateResidentSession(sessionToken: string): Promise<void> {
  // Delete the session from database
  await db
    .delete(residentSessions)
    .where(eq(residentSessions.sessionToken, sessionToken));
}

/**
 * Clean up expired sessions (can be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db
    .delete(residentSessions)
    .where(lte(residentSessions.expiresAt, new Date()));
}

/**
 * Get all active sessions for a property (for admin)
 * @param propertyId - Database ID of the property
 */
export async function getActiveSessionsForProperty(propertyId: number) {
  return await db
    .select({
      id: residentSessions.id,
      sessionToken: residentSessions.sessionToken,
      createdAt: residentSessions.createdAt,
      lastSeenAt: residentSessions.lastSeenAt,
      expiresAt: residentSessions.expiresAt,
    })
    .from(residentSessions)
    .where(
      and(
        eq(residentSessions.propertyId, propertyId),
        gte(residentSessions.expiresAt, new Date())
      )
    );
}
