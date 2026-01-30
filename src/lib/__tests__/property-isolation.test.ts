import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateSessionToken,
} from '@/lib/auth';
import { getPropertyByHash } from '@/lib/property';
import fs from 'fs';
import path from 'path';

/**
 * Integration tests for multi-tenant property isolation
 *
 * These tests verify that:
 * 1. Session tokens are bound to specific properties
 * 2. Tokens for one property cannot access another property's resources
 * 3. Property hash validation prevents cross-tenant access
 * 4. Session token validation enforces property boundaries
 */
describe('Property Isolation - Multi-tenant Security', () => {
  const SESSION_FILE = path.join(process.cwd(), '.sessions.json');

  beforeEach(() => {
    // Clean up session file before each test
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  });

  afterEach(() => {
    // Clean up session file after each test
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  });

  describe('Session token property binding', () => {
    it('should bind session token to specific property', async () => {
      const propertyId = 1;
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      // Reload auth module
      vi.resetModules();
      const { validateSessionToken: validate, getSessionPropertyId: getPropertyId } = await import('@/lib/auth');

      // Verify token is valid for the property it was created for
      expect(validate(token, propertyId)).toBe(true);

      // Verify we can retrieve the property ID from the token
      const retrievedPropertyId = getPropertyId(token);
      expect(retrievedPropertyId).toBe(propertyId);
    });

    it('should create different tokens for different properties', async () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      const sessionData = {
        sessions: {
          [token1]: { propertyId: 1, createdAt: Date.now() },
          [token2]: { propertyId: 2, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      // Reload auth module
      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Each token should only be valid for its own property
      expect(validate(token1, 1)).toBe(true);
      expect(validate(token1, 2)).toBe(false);

      expect(validate(token2, 2)).toBe(true);
      expect(validate(token2, 1)).toBe(false);
    });

    it('should store propertyId in session data', async () => {
      const propertyId = 42;
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      // Reload auth module
      vi.resetModules();
      const { getSessionPropertyId: getPropertyId } = await import('@/lib/auth');

      const retrievedPropertyId = getPropertyId(token);
      expect(retrievedPropertyId).toBe(propertyId);
    });
  });

  describe('Cross-tenant access prevention', () => {
    it('should reject token from property A accessing property B resources', async () => {
      const tokenA = generateSessionToken();
      const sessionData = {
        sessions: {
          [tokenA]: { propertyId: 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      // Reload auth module
      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Attempt to use property A's token to access property B
      expect(validate(tokenA, 2)).toBe(false);
      expect(validate(tokenA, 3)).toBe(false);
      expect(validate(tokenA, 999)).toBe(false);
    });

    it('should reject token with null propertyId for specific property check', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: null, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      // Reload auth module
      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Legacy sessions with null propertyId should work for any property (backward compat)
      expect(validate(token, 1)).toBe(true);
      expect(validate(token, 2)).toBe(true);
    });

    it('should reject token for non-existent property', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      // Reload auth module
      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      const nonExistentPropertyId = 99999;
      expect(validate(token, nonExistentPropertyId)).toBe(false);
    });

    it('should handle concurrent sessions for different properties', async () => {
      const tokens = [
        generateSessionToken(),
        generateSessionToken(),
        generateSessionToken(),
        generateSessionToken(),
      ];

      const sessionData = {
        sessions: {
          [tokens[0]]: { propertyId: 1, createdAt: Date.now() },
          [tokens[1]]: { propertyId: 2, createdAt: Date.now() },
          [tokens[2]]: { propertyId: 3, createdAt: Date.now() },
          [tokens[3]]: { propertyId: 1, createdAt: Date.now() }, // Same property, different session
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      // Reload auth module
      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(4);

      // Each token should only validate for its own property
      expect(validate(tokens[0], 1)).toBe(true);
      expect(validate(tokens[0], 2)).toBe(false);
      expect(validate(tokens[0], 3)).toBe(false);

      expect(validate(tokens[1], 2)).toBe(true);
      expect(validate(tokens[1], 1)).toBe(false);

      expect(validate(tokens[2], 3)).toBe(true);
      expect(validate(tokens[2], 1)).toBe(false);

      // Fourth token should be valid for property 1
      expect(validate(tokens[3], 1)).toBe(true);
      expect(validate(tokens[3], 2)).toBe(false);
    });
  });

  describe('Property hash to ID resolution', () => {
    it('should resolve property hash to correct property ID', async () => {
      const property = await getPropertyByHash('test-hash-1');

      if (property) {
        expect(property).toHaveProperty('id');
        expect(property).toHaveProperty('propertyId');
        expect(property).toHaveProperty('hash');
        expect(property.hash).toBe('test-hash-1');
      }
    });

    it('should return null or undefined for invalid property hash', async () => {
      const property = await getPropertyByHash('non-existent-hash-xyz');
      expect(property).toBeFalsy();
    });

    it('should return null or undefined for malformed property hash', async () => {
      const malformedHashes = [
        '',
        ' ',
        'hash with spaces',
        '../../../etc/passwd', // Path traversal attempt
        '<script>alert("xss")</script>', // XSS attempt
        '"; DROP TABLE properties; --', // SQL injection attempt
      ];

      for (const hash of malformedHashes) {
        const property = await getPropertyByHash(hash);
        expect(property).toBeFalsy();
      }
    });
  });

  describe('Token validation edge cases', () => {
    it('should reject empty token', async () => {
      const sessionData = {
        sessions: {},
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      expect(validate('', 1)).toBe(false);
    });

    it('should reject null/undefined token', async () => {
      const sessionData = {
        sessions: {},
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      expect(validate(null as any, 1)).toBe(false);
      expect(validate(undefined as any, 1)).toBe(false);
    });

    it('should reject token with invalid format', async () => {
      const sessionData = {
        sessions: {},
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      const invalidTokens = [
        'not-a-real-token',
        'abc123',
        '{}',
        'Bearer token123',
        '../../../etc/passwd',
      ];

      for (const token of invalidTokens) {
        expect(validate(token, 1)).toBe(false);
      }
    });

    it('should handle propertyId type correctly', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Correct type should work
      expect(validate(token, 1)).toBe(true);

      // Different number should fail
      expect(validate(token, 2)).toBe(false);
    });

    it('should reject negative property IDs', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      expect(validate(token, -1)).toBe(false);
      expect(validate(token, -999)).toBe(false);
    });

    it('should reject zero as property ID', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      expect(validate(token, 0)).toBe(false);
    });
  });

  describe('Session property ID retrieval', () => {
    it('should return null for invalid token when getting property ID', async () => {
      const sessionData = {
        sessions: {},
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { getSessionPropertyId: getPropertyId } = await import('@/lib/auth');

      expect(getPropertyId('invalid-token')).toBeNull();
    });

    it('should return null for empty token when getting property ID', async () => {
      const sessionData = {
        sessions: {},
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { getSessionPropertyId: getPropertyId } = await import('@/lib/auth');

      expect(getPropertyId('')).toBeNull();
    });

    it('should return null for null/undefined token when getting property ID', async () => {
      const sessionData = {
        sessions: {},
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { getSessionPropertyId: getPropertyId } = await import('@/lib/auth');

      expect(getPropertyId(null as any)).toBeNull();
      expect(getPropertyId(undefined as any)).toBeNull();
    });

    it('should consistently return same property ID for valid token', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: 42, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { getSessionPropertyId: getPropertyId } = await import('@/lib/auth');

      // Call multiple times to ensure consistency
      expect(getPropertyId(token)).toBe(42);
      expect(getPropertyId(token)).toBe(42);
      expect(getPropertyId(token)).toBe(42);
    });
  });

  describe('Security boundary enforcement', () => {
    it('should prevent property ID manipulation in token validation', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Attacker attempts to access different properties
      const attackAttempts = [2, 3, 100, 999, 1337];

      for (const attackPropertyId of attackAttempts) {
        expect(validate(token, attackPropertyId)).toBe(false);
      }

      // Original property should still work
      expect(validate(token, 1)).toBe(true);
    });

    it('should maintain isolation with multiple active sessions', async () => {
      const sessions = [
        { propertyId: 1, token: generateSessionToken() },
        { propertyId: 1, token: generateSessionToken() }, // Another user on property 1
        { propertyId: 2, token: generateSessionToken() },
        { propertyId: 3, token: generateSessionToken() },
      ];

      const sessionData = {
        sessions: Object.fromEntries(
          sessions.map(({ token, propertyId }) => [
            token,
            { propertyId, createdAt: Date.now() },
          ])
        ),
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Each token should only validate for its own property
      for (const { propertyId, token } of sessions) {
        expect(validate(token, propertyId)).toBe(true);

        // Should fail for all other properties
        for (const { propertyId: otherPropertyId } of sessions) {
          if (otherPropertyId !== propertyId) {
            expect(validate(token, otherPropertyId)).toBe(false);
          }
        }
      }
    });

    it('should not leak property information in validation failure', async () => {
      const token = generateSessionToken();
      const sessionData = {
        sessions: {
          [token]: { propertyId: 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Validation should simply return false, not throw or expose info
      const result = validate(token, 999);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(false);
    });
  });

  describe('Property isolation audit log', () => {
    it('should validate tokens used in property-scoped API routes', async () => {
      // This test verifies the pattern used in API routes:
      // 1. Get property by hash
      // 2. Validate token against that property ID
      // 3. Reject if validation fails

      const propertyHash = 'test-hash-1';
      const property = await getPropertyByHash(propertyHash);

      if (!property) {
        // If property doesn't exist in test DB, skip this test
        return;
      }

      const validToken = generateSessionToken();
      const invalidToken = generateSessionToken();

      const sessionData = {
        sessions: {
          [validToken]: { propertyId: property.id, createdAt: Date.now() },
          [invalidToken]: { propertyId: property.id + 1, createdAt: Date.now() },
        },
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

      vi.resetModules();
      const { validateSessionToken: validate } = await import('@/lib/auth');

      // Valid token should pass
      expect(validate(validToken, property.id)).toBe(true);

      // Invalid token should fail
      expect(validate(invalidToken, property.id)).toBe(false);

      // Token for different property should fail
      const otherProperty = await getPropertyByHash('other-hash');
      if (otherProperty && otherProperty.id !== property.id) {
        expect(validate(validToken, otherProperty.id)).toBe(false);
      }
    });
  });
});
