import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createShortLink, getShortLinkByCode, deactivateShortLink } from '../short-link';
import { cleanDatabase, createTestProperty, closeTestDb } from '@/../test/db-utils';

describe('short-link', () => {
  let testProperty: any;

  beforeEach(async () => {
    await cleanDatabase();
    testProperty = await createTestProperty();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('createShortLink', () => {
    it('returns id, code, and shortUrl', async () => {
      const link = await createShortLink({
        propertyId: testProperty.id,
        campaign: 'admin',
      });

      expect(link).toHaveProperty('id');
      expect(link).toHaveProperty('code');
      expect(link).toHaveProperty('shortUrl');
    });

    it('generates an 8-character URL-safe code', async () => {
      const link = await createShortLink({
        propertyId: testProperty.id,
        campaign: 'admin',
      });

      expect(link.code).toHaveLength(8);
      expect(link.code).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('builds shortUrl from NEXT_PUBLIC_SITE_URL and code', async () => {
      const link = await createShortLink({
        propertyId: testProperty.id,
        campaign: 'admin',
      });

      expect(link.shortUrl).toBe(`${process.env.NEXT_PUBLIC_SITE_URL}/s/${link.code}`);
    });

    it('generates unique codes across multiple links', async () => {
      const links = await Promise.all(
        Array.from({ length: 10 }, () =>
          createShortLink({ propertyId: testProperty.id, campaign: 'admin' })
        )
      );

      const codes = new Set(links.map(l => l.code));
      expect(codes.size).toBe(10);
    });
  });

  describe('getShortLinkByCode', () => {
    it('returns the short link for an active code', async () => {
      const created = await createShortLink({
        propertyId: testProperty.id,
        campaign: 'unit_card',
        content: '4A',
        unit: '4A',
        label: 'Unit 4A',
      });

      const found = await getShortLinkByCode(created.code);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.campaign).toBe('unit_card');
      expect(found!.content).toBe('4A');
      expect(found!.unit).toBe('4A');
    });

    it('returns null for a nonexistent code', async () => {
      const found = await getShortLinkByCode('ZZZZZZZZ');
      expect(found).toBeNull();
    });

    it('returns null for a deactivated link', async () => {
      const created = await createShortLink({
        propertyId: testProperty.id,
        campaign: 'admin',
      });

      await deactivateShortLink(created.id);

      const found = await getShortLinkByCode(created.code);
      expect(found).toBeNull();
    });
  });
});
