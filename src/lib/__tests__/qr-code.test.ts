import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  generateAccessToken,
  createQRCodeImage,
  generatePropertyQRCode,
  validateAccessToken,
  toggleAccessToken,
  getAccessTokensForProperty,
  getAllAccessTokens,
} from '@/lib/qr-code';
import { getTestDb, cleanDatabase, createTestProperty, closeTestDb } from '@/../test/db-utils';
import { accessTokens } from '@/lib/schema';
import { eq } from 'drizzle-orm';

describe('QR Code Functions', () => {
  let testProperty: any;

  beforeEach(async () => {
    await cleanDatabase();
    testProperty = await createTestProperty();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('generateAccessToken', () => {
    it('generates a URL-safe base64 string', () => {
      const token = generateAccessToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // Base64url should only contain A-Z, a-z, 0-9, -, and _
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates 43-character tokens', () => {
      const token = generateAccessToken();

      // 32 bytes in base64url = 43 characters
      expect(token.length).toBe(43);
    });

    it('generates unique tokens', () => {
      const token1 = generateAccessToken();
      const token2 = generateAccessToken();
      const token3 = generateAccessToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('generates cryptographically random tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateAccessToken());
      }
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('createQRCodeImage', () => {
    it('returns data URL format', async () => {
      const url = 'https://example.com/test';
      const qrCode = await createQRCodeImage(url);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('generates different QR codes for different URLs', async () => {
      const qrCode1 = await createQRCodeImage('https://example.com/test1');
      const qrCode2 = await createQRCodeImage('https://example.com/test2');

      expect(qrCode1).not.toBe(qrCode2);
    });

    it('generates consistent QR code for same URL', async () => {
      const url = 'https://example.com/test';
      const qrCode1 = await createQRCodeImage(url);
      const qrCode2 = await createQRCodeImage(url);

      expect(qrCode1).toBe(qrCode2);
    });

    it('handles long URLs', async () => {
      const longUrl = 'https://example.com/very/long/path/that/might/be/used/in/the/application?with=many&query=parameters&and=more';
      const qrCode = await createQRCodeImage(longUrl);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('generatePropertyQRCode', () => {
    it('returns object with all required fields', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      expect(result).toHaveProperty('tokenId');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('qrCodeDataUrl');
      expect(result).toHaveProperty('fullUrl');
    });

    it('stores token in database', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      const db = getTestDb();
      const tokens = await db
        .select()
        .from(accessTokens)
        .where(eq(accessTokens.id, result.tokenId));

      expect(tokens.length).toBe(1);
      expect(tokens[0].token).toBe(result.token);
      expect(tokens[0].label).toBe('Test QR Code');
      expect(tokens[0].isActive).toBe(true);
    });

    it('builds correct full URL', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      expect(result.fullUrl).toBe(`${process.env.NEXT_PUBLIC_SITE_URL}/${testProperty.hash}?auth=${result.token}`);
    });

    it('generates valid QR code data URL', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('handles optional expiration date', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code',
        expiresAt
      );

      const db = getTestDb();
      const tokens = await db
        .select()
        .from(accessTokens)
        .where(eq(accessTokens.id, result.tokenId));

      expect(tokens[0].expiresAt).toEqual(expiresAt);
    });

    it('throws error if NEXT_PUBLIC_SITE_URL not set', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;

      await expect(
        generatePropertyQRCode(testProperty.id, testProperty.hash, 'Test')
      ).rejects.toThrow('NEXT_PUBLIC_SITE_URL environment variable must be set');

      process.env.NEXT_PUBLIC_SITE_URL = originalUrl;
    });
  });

  describe('validateAccessToken', () => {
    it('validates active token without expiration', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      const validation = await validateAccessToken(result.token, testProperty.hash);

      expect(validation).not.toBeNull();
      expect(validation!.propertyId).toBe(testProperty.id);
      expect(validation!.tokenId).toBe(result.tokenId);
    });

    it('rejects non-existent token', async () => {
      const fakeToken = 'nonexistent-token-that-does-not-exist';

      const validation = await validateAccessToken(fakeToken, testProperty.hash);

      expect(validation).toBeNull();
    });

    it('rejects inactive token', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      // Deactivate the token
      await toggleAccessToken(result.tokenId, false);

      const validation = await validateAccessToken(result.token, testProperty.hash);

      expect(validation).toBeNull();
    });

    it('rejects expired token', async () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code',
        pastDate
      );

      const validation = await validateAccessToken(result.token, testProperty.hash);

      expect(validation).toBeNull();
    });

    it('validates token that has not yet expired', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code',
        futureDate
      );

      const validation = await validateAccessToken(result.token, testProperty.hash);

      expect(validation).not.toBeNull();
      expect(validation!.propertyId).toBe(testProperty.id);
    });
  });

  describe('toggleAccessToken', () => {
    it('deactivates active token', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      await toggleAccessToken(result.tokenId, false);

      const db = getTestDb();
      const tokens = await db
        .select()
        .from(accessTokens)
        .where(eq(accessTokens.id, result.tokenId));

      expect(tokens[0].isActive).toBe(false);
    });

    it('activates inactive token', async () => {
      const result = await generatePropertyQRCode(
        testProperty.id,
        testProperty.hash,
        'Test QR Code'
      );

      // First deactivate
      await toggleAccessToken(result.tokenId, false);
      // Then reactivate
      await toggleAccessToken(result.tokenId, true);

      const db = getTestDb();
      const tokens = await db
        .select()
        .from(accessTokens)
        .where(eq(accessTokens.id, result.tokenId));

      expect(tokens[0].isActive).toBe(true);
    });
  });

  describe('getAccessTokensForProperty', () => {
    it('returns all tokens for specific property', async () => {
      await generatePropertyQRCode(testProperty.id, testProperty.hash, 'QR 1');
      await generatePropertyQRCode(testProperty.id, testProperty.hash, 'QR 2');
      await generatePropertyQRCode(testProperty.id, testProperty.hash, 'QR 3');

      const tokens = await getAccessTokensForProperty(testProperty.id);

      expect(tokens.length).toBe(3);
      expect(tokens[0].label).toBe('QR 1');
      expect(tokens[1].label).toBe('QR 2');
      expect(tokens[2].label).toBe('QR 3');
    });

    it('returns empty array for property with no tokens', async () => {
      const tokens = await getAccessTokensForProperty(testProperty.id);

      expect(tokens.length).toBe(0);
      expect(tokens).toEqual([]);
    });

    it('isolates tokens by property', async () => {
      const property2 = await createTestProperty();

      await generatePropertyQRCode(testProperty.id, testProperty.hash, 'Property 1 QR');
      await generatePropertyQRCode(property2.id, property2.hash, 'Property 2 QR');

      const tokens1 = await getAccessTokensForProperty(testProperty.id);
      const tokens2 = await getAccessTokensForProperty(property2.id);

      expect(tokens1.length).toBe(1);
      expect(tokens1[0].label).toBe('Property 1 QR');

      expect(tokens2.length).toBe(1);
      expect(tokens2[0].label).toBe('Property 2 QR');
    });
  });

  describe('getAllAccessTokens', () => {
    it('returns all tokens across all properties', async () => {
      const property2 = await createTestProperty();

      await generatePropertyQRCode(testProperty.id, testProperty.hash, 'Property 1 QR');
      await generatePropertyQRCode(property2.id, property2.hash, 'Property 2 QR');

      const allTokens = await getAllAccessTokens();

      expect(allTokens.length).toBe(2);
      expect(allTokens.find(t => t.label === 'Property 1 QR')).toBeDefined();
      expect(allTokens.find(t => t.label === 'Property 2 QR')).toBeDefined();
    });

    it('returns empty array when no tokens exist', async () => {
      const allTokens = await getAllAccessTokens();

      expect(allTokens.length).toBe(0);
      expect(allTokens).toEqual([]);
    });
  });
});
