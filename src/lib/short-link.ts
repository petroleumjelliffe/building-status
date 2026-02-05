import { randomBytes } from 'crypto';
import { db } from './db';
import { shortLinks } from './schema';
import { eq, and } from 'drizzle-orm';

/** Generate a random 8-character URL-safe code (base64url). */
function generateCode(): string {
  return randomBytes(6).toString('base64url');
}

export interface CreateShortLinkOptions {
  propertyId: number;
  accessTokenId?: number;
  unit?: string;
  campaign: string;
  content?: string;
  label?: string;
}

export interface ShortLinkData {
  id: number;
  code: string;
  propertyId: number;
  accessTokenId: number | null;
  unit: string | null;
  campaign: string;
  content: string | null;
  label: string | null;
  isActive: boolean;
}

/**
 * Create a short link record in the database.
 * Generates a unique code with collision retry.
 */
export async function createShortLink(
  options: CreateShortLinkOptions
): Promise<{ id: number; code: string; shortUrl: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable must be set');
  }

  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateCode();
    try {
      const [record] = await db
        .insert(shortLinks)
        .values({
          code,
          propertyId: options.propertyId,
          accessTokenId: options.accessTokenId ?? null,
          unit: options.unit ?? null,
          campaign: options.campaign,
          content: options.content ?? null,
          label: options.label ?? null,
          isActive: true,
        })
        .returning({ id: shortLinks.id });

      return {
        id: record.id,
        code,
        shortUrl: `${baseUrl}/s/${code}`,
      };
    } catch (error: any) {
      // Retry on unique constraint violation (code collision)
      if (error?.code === '23505' && attempt < maxRetries - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique short link code after max retries');
}

/**
 * Look up an active short link by its code.
 * Returns null if not found or inactive.
 */
export async function getShortLinkByCode(code: string): Promise<ShortLinkData | null> {
  const [record] = await db
    .select({
      id: shortLinks.id,
      code: shortLinks.code,
      propertyId: shortLinks.propertyId,
      accessTokenId: shortLinks.accessTokenId,
      unit: shortLinks.unit,
      campaign: shortLinks.campaign,
      content: shortLinks.content,
      label: shortLinks.label,
      isActive: shortLinks.isActive,
    })
    .from(shortLinks)
    .where(and(eq(shortLinks.code, code), eq(shortLinks.isActive, true)));

  return record || null;
}

/**
 * Deactivate a short link by ID.
 */
export async function deactivateShortLink(id: number): Promise<void> {
  await db
    .update(shortLinks)
    .set({ isActive: false })
    .where(eq(shortLinks.id, id));
}
