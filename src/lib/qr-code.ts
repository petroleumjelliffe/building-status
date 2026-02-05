import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { db } from './db';
import { accessTokens } from './schema';
import { eq } from 'drizzle-orm';
import { createShortLink } from './short-link';

/**
 * Generate a cryptographically secure access token
 * @returns 43-character URL-safe string
 */
export function generateAccessToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create a QR code image from a URL
 * @param url - The URL to encode in the QR code
 * @returns Data URL that can be used as img src or downloaded
 */
export async function createQRCodeImage(url: string): Promise<string> {
  const qrCodeDataUrl = await QRCode.toDataURL(url, {
    width: 500,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });

  return qrCodeDataUrl;
}

/**
 * Generate a complete QR code for property access.
 * Creates an access token and a short link, then generates a QR code
 * encoding the short URL (e.g., status.example.com/s/a7x9Km).
 * UTM parameters are injected at redirect time by the /s/[code] route.
 *
 * @param propertyId - Database ID of the property
 * @param propertyHash - URL hash for the property
 * @param label - Human-readable label for this QR code
 * @param expiresAt - Optional expiration date
 * @param options - Optional campaign/content for UTM tracking
 * @returns Object with token, QR code image, short URL, and short link details
 */
export async function generatePropertyQRCode(
  propertyId: number,
  propertyHash: string,
  label: string,
  expiresAt?: Date,
  options?: { campaign?: string; content?: string; unit?: string }
): Promise<{
  tokenId: number;
  token: string;
  qrCodeDataUrl: string;
  fullUrl: string;
  shortLinkId: number;
  code: string;
}> {
  // Generate access token
  const token = generateAccessToken();

  // Store token in database
  const [accessToken] = await db
    .insert(accessTokens)
    .values({
      propertyId,
      token,
      label,
      isActive: true,
      expiresAt,
    })
    .returning({ id: accessTokens.id });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable must be set to generate QR codes');
  }

  // Create short link — QR code encodes the short URL
  const shortLink = await createShortLink({
    propertyId,
    accessTokenId: accessToken.id,
    unit: options?.unit,
    campaign: options?.campaign || 'admin',
    content: options?.content || label,
    label,
  });

  // Generate QR code image encoding the short URL
  const qrCodeDataUrl = await createQRCodeImage(shortLink.shortUrl);

  return {
    tokenId: accessToken.id,
    token,
    qrCodeDataUrl,
    fullUrl: shortLink.shortUrl,
    shortLinkId: shortLink.id,
    code: shortLink.code,
  };
}

/**
 * Create a QR code with a short link but no access token.
 * Used for property signs, maintenance signs, and other public QR codes.
 *
 * @param propertyId - Database ID of the property
 * @param campaign - UTM campaign value (e.g., 'property_sign', 'maintenance_sign')
 * @param content - Optional UTM content value
 * @param label - Optional admin-facing label
 * @returns Object with QR code image and short URL
 */
export async function createPublicShortLinkQR(
  propertyId: number,
  campaign: string,
  content?: string,
  label?: string,
): Promise<{
  qrCodeDataUrl: string;
  shortUrl: string;
  code: string;
}> {
  const shortLink = await createShortLink({
    propertyId,
    campaign,
    content,
    label,
  });

  const qrCodeDataUrl = await createQRCodeImage(shortLink.shortUrl);

  return {
    qrCodeDataUrl,
    shortUrl: shortLink.shortUrl,
    code: shortLink.code,
  };
}

/**
 * Validate an access token
 * @param token - The access token to validate
 * @param propertyHash - The property hash from the URL
 * @returns Property ID if valid, null if invalid
 */
export async function validateAccessToken(
  token: string,
  propertyHash: string
): Promise<{ propertyId: number; tokenId: number } | null> {
  // Look up token in database
  const [accessToken] = await db
    .select({
      id: accessTokens.id,
      propertyId: accessTokens.propertyId,
      isActive: accessTokens.isActive,
      expiresAt: accessTokens.expiresAt,
    })
    .from(accessTokens)
    .where(eq(accessTokens.token, token));

  if (!accessToken) {
    return null;
  }

  // Check if token is active
  if (!accessToken.isActive) {
    return null;
  }

  // Check if token has expired
  if (accessToken.expiresAt && new Date(accessToken.expiresAt) < new Date()) {
    return null;
  }

  // Token is valid
  return {
    propertyId: accessToken.propertyId,
    tokenId: accessToken.id,
  };
}

/**
 * Toggle the active status of an access token
 * @param tokenId - Database ID of the access token
 * @param isActive - New active status
 */
export async function toggleAccessToken(
  tokenId: number,
  isActive: boolean
): Promise<void> {
  await db
    .update(accessTokens)
    .set({ isActive })
    .where(eq(accessTokens.id, tokenId));
}

/**
 * Get all access tokens for a property
 * @param propertyId - Database ID of the property
 */
export async function getAccessTokensForProperty(propertyId: number) {
  return await db
    .select({
      id: accessTokens.id,
      propertyId: accessTokens.propertyId,
      token: accessTokens.token,
      label: accessTokens.label,
      isActive: accessTokens.isActive,
      createdAt: accessTokens.createdAt,
      expiresAt: accessTokens.expiresAt,
    })
    .from(accessTokens)
    .where(eq(accessTokens.propertyId, propertyId));
}

/**
 * Get all access tokens (for admin overview)
 */
export async function getAllAccessTokens() {
  return await db
    .select({
      id: accessTokens.id,
      propertyId: accessTokens.propertyId,
      token: accessTokens.token,
      label: accessTokens.label,
      isActive: accessTokens.isActive,
      createdAt: accessTokens.createdAt,
      expiresAt: accessTokens.expiresAt,
    })
    .from(accessTokens);
}

/**
 * Get a single access token by ID
 * @param tokenId - Database ID of the access token
 */
export async function getAccessTokenById(tokenId: number) {
  const [accessToken] = await db
    .select({
      id: accessTokens.id,
      propertyId: accessTokens.propertyId,
      token: accessTokens.token,
      label: accessTokens.label,
      isActive: accessTokens.isActive,
      createdAt: accessTokens.createdAt,
      expiresAt: accessTokens.expiresAt,
    })
    .from(accessTokens)
    .where(eq(accessTokens.id, tokenId));

  return accessToken || null;
}
