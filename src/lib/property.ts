import { randomBytes } from 'crypto';
import { db } from './db';
import { properties } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a URL-safe hash for a property
 * Returns an 8-character string suitable for URLs
 */
export function generatePropertyHash(): string {
  // Generate 6 random bytes and convert to base64url, then take first 8 chars
  return randomBytes(6).toString('base64url').slice(0, 8);
}

/**
 * Create a new property
 */
export async function createProperty(propertyId: string, name: string) {
  const hash = generatePropertyHash();

  const [property] = await db.insert(properties).values({
    propertyId,
    hash,
    name,
  }).returning();

  return property;
}

/**
 * Get a property by its hash
 */
export async function getPropertyByHash(hash: string) {
  const [property] = await db.select().from(properties).where(eq(properties.hash, hash));
  return property;
}

/**
 * Get a property by its ID
 */
export async function getPropertyById(id: number) {
  const [property] = await db.select().from(properties).where(eq(properties.id, id));
  return property;
}

/**
 * Get a property by its property ID (slug)
 */
export async function getPropertyByPropertyId(propertyId: string) {
  const [property] = await db.select().from(properties).where(eq(properties.propertyId, propertyId));
  return property;
}

/**
 * Get all properties
 */
export async function getAllProperties() {
  return db.select().from(properties);
}

/**
 * Get the default property (ID = 1)
 */
export async function getDefaultProperty() {
  return getPropertyById(1);
}
