import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  getConfigValue,
  setConfigValue,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  createIssue,
  updateIssue,
  resolveIssue,
  createMaintenance,
  updateMaintenance,
  completeMaintenance,
  createEvent,
  completeEvent,
  cancelEvent,
} from '@/lib/queries';
import { getTestDb, cleanDatabase, createTestProperty, closeTestDb } from '@/../test/db-utils';
import { announcements, issues, maintenance, events } from '@/lib/schema';
import { eq } from 'drizzle-orm';

describe('Simple Query Functions - CRUD Operations', () => {
  let testProperty: any;
  let testProperty2: any;

  beforeEach(async () => {
    await cleanDatabase();
    testProperty = await createTestProperty();
    testProperty2 = await createTestProperty();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('Config Functions', () => {
    describe('getConfigValue', () => {
      it('returns null for non-existent key', async () => {
        const result = await getConfigValue('nonexistent', testProperty.id);
        expect(result).toBeNull();
      });

      it('returns value for existing key', async () => {
        await setConfigValue('testKey', { data: 'value' }, testProperty.id);
        const result = await getConfigValue('testKey', testProperty.id);
        expect(result).toEqual({ data: 'value' });
      });

      it('isolates values by propertyId', async () => {
        await setConfigValue('key', { value: 1 }, testProperty.id);
        await setConfigValue('key', { value: 2 }, testProperty2.id);

        const result1 = await getConfigValue('key', testProperty.id);
        const result2 = await getConfigValue('key', testProperty2.id);

        expect(result1).toEqual({ value: 1 });
        expect(result2).toEqual({ value: 2 });
      });

      it('handles different data types', async () => {
        await setConfigValue('string', 'hello', testProperty.id);
        await setConfigValue('number', 42, testProperty.id);
        await setConfigValue('boolean', true, testProperty.id);
        await setConfigValue('array', [1, 2, 3], testProperty.id);
        await setConfigValue('object', { nested: { value: 'test' } }, testProperty.id);

        expect(await getConfigValue('string', testProperty.id)).toBe('hello');
        expect(await getConfigValue('number', testProperty.id)).toBe(42);
        expect(await getConfigValue('boolean', testProperty.id)).toBe(true);
        expect(await getConfigValue('array', testProperty.id)).toEqual([1, 2, 3]);
        expect(await getConfigValue('object', testProperty.id)).toEqual({ nested: { value: 'test' } });
      });
    });

    describe('setConfigValue', () => {
      it('inserts new value', async () => {
        await setConfigValue('newKey', { data: 'new' }, testProperty.id);
        const result = await getConfigValue('newKey', testProperty.id);
        expect(result).toEqual({ data: 'new' });
      });

      it('updates existing value (upsert)', async () => {
        await setConfigValue('key', { data: 'original' }, testProperty.id);
        await setConfigValue('key', { data: 'updated' }, testProperty.id);

        const result = await getConfigValue('key', testProperty.id);
        expect(result).toEqual({ data: 'updated' });
      });

      it('updates only affect specific propertyId', async () => {
        await setConfigValue('key', { data: 'prop1' }, testProperty.id);
        await setConfigValue('key', { data: 'prop2' }, testProperty2.id);
        await setConfigValue('key', { data: 'prop1-updated' }, testProperty.id);

        const result1 = await getConfigValue('key', testProperty.id);
        const result2 = await getConfigValue('key', testProperty2.id);

        expect(result1).toEqual({ data: 'prop1-updated' });
        expect(result2).toEqual({ data: 'prop2' }); // Unchanged
      });
    });
  });

  describe('Announcement Functions', () => {
    describe('updateAnnouncement', () => {
      it('updates announcement type', async () => {
        const id = await createAnnouncement(testProperty.id, 'info', 'Test message', undefined);

        await updateAnnouncement(id, testProperty.id, { type: 'warning' });

        const db = getTestDb();
        const result = await db.select().from(announcements).where(eq(announcements.id, id));
        expect(result[0].type).toBe('warning');
        expect(result[0].message).toBe('Test message'); // Unchanged
      });

      it('updates announcement message', async () => {
        const id = await createAnnouncement(testProperty.id, 'info', 'Original message', undefined);

        await updateAnnouncement(id, testProperty.id, { message: 'Updated message' });

        const db = getTestDb();
        const result = await db.select().from(announcements).where(eq(announcements.id, id));
        expect(result[0].message).toBe('Updated message');
        expect(result[0].type).toBe('info'); // Unchanged
      });

      it('updates announcement expiresAt', async () => {
        const id = await createAnnouncement(testProperty.id, 'info', 'Test message', undefined);
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await updateAnnouncement(id, testProperty.id, { expiresAt: futureDate });

        const db = getTestDb();
        const result = await db.select().from(announcements).where(eq(announcements.id, id));
        expect(result[0].expiresAt).toEqual(futureDate);
      });

      it('updates multiple fields at once', async () => {
        const id = await createAnnouncement(testProperty.id, 'info', 'Original', undefined);
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await updateAnnouncement(id, testProperty.id, {
          type: 'alert',
          message: 'Updated',
          expiresAt: futureDate,
        });

        const db = getTestDb();
        const result = await db.select().from(announcements).where(eq(announcements.id, id));
        expect(result[0].type).toBe('alert');
        expect(result[0].message).toBe('Updated');
        expect(result[0].expiresAt).toEqual(futureDate);
      });
    });

    describe('deleteAnnouncement', () => {
      it('deletes announcement', async () => {
        const id = await createAnnouncement(testProperty.id, 'info', 'Test message', undefined);

        await deleteAnnouncement(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(announcements).where(eq(announcements.id, id));
        expect(result.length).toBe(0);
      });

      it('only deletes specified announcement', async () => {
        const id1 = await createAnnouncement(testProperty.id, 'info', 'Message 1', undefined);
        const id2 = await createAnnouncement(testProperty.id, 'warning', 'Message 2', undefined);

        await deleteAnnouncement(id1, testProperty.id);

        const db = getTestDb();
        const remaining = await db.select().from(announcements);
        expect(remaining.length).toBe(1);
        expect(remaining[0].id).toBe(id2);
      });
    });
  });

  describe('Issue Functions', () => {
    describe('updateIssue', () => {
      it('updates issue category', async () => {
        const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak', 'reported');

        await updateIssue(id, testProperty.id, { category: 'Electrical' });

        const db = getTestDb();
        const result = await db.select().from(issues).where(eq(issues.id, id));
        expect(result[0].category).toBe('Electrical');
        expect(result[0].location).toBe('Floor 2'); // Unchanged
      });

      it('updates multiple fields', async () => {
        const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak', 'reported');

        await updateIssue(id, testProperty.id, {
          status: 'investigating',
          detail: 'Major leak found',
          icon: '💧',
        });

        const db = getTestDb();
        const result = await db.select().from(issues).where(eq(issues.id, id));
        expect(result[0].status).toBe('investigating');
        expect(result[0].detail).toBe('Major leak found');
        expect(result[0].icon).toBe('💧');
      });
    });

    describe('resolveIssue', () => {
      it('sets resolvedAt timestamp', async () => {
        const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak', 'reported');
        const beforeResolve = new Date();

        await resolveIssue(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(issues).where(eq(issues.id, id));
        expect(result[0].resolvedAt).toBeDefined();
        expect(result[0].resolvedAt).toBeInstanceOf(Date);
        expect(result[0].resolvedAt!.getTime()).toBeGreaterThanOrEqual(beforeResolve.getTime());
      });

      it('does not affect other fields', async () => {
        const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak', 'reported', '🔧');

        await resolveIssue(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(issues).where(eq(issues.id, id));
        expect(result[0].category).toBe('Plumbing');
        expect(result[0].location).toBe('Floor 2');
        expect(result[0].status).toBe('reported');
        expect(result[0].icon).toBe('🔧');
      });
    });
  });

  describe('Maintenance Functions', () => {
    describe('updateMaintenance', () => {
      it('updates maintenance date', async () => {
        const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Test maintenance');

        await updateMaintenance(id, testProperty.id, { date: 'Tue, Jan 2' });

        const db = getTestDb();
        const result = await db.select().from(maintenance).where(eq(maintenance.id, id));
        expect(result[0].date).toBe('Tue, Jan 2');
        expect(result[0].description).toBe('Test maintenance'); // Unchanged
      });

      it('updates maintenance description', async () => {
        const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Original description');

        await updateMaintenance(id, testProperty.id, { description: 'Updated description' });

        const db = getTestDb();
        const result = await db.select().from(maintenance).where(eq(maintenance.id, id));
        expect(result[0].description).toBe('Updated description');
        expect(result[0].date).toBe('Mon, Jan 1'); // Unchanged
      });

      it('updates both fields', async () => {
        const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Original');

        await updateMaintenance(id, testProperty.id, {
          date: 'Wed, Jan 3',
          description: 'Updated',
        });

        const db = getTestDb();
        const result = await db.select().from(maintenance).where(eq(maintenance.id, id));
        expect(result[0].date).toBe('Wed, Jan 3');
        expect(result[0].description).toBe('Updated');
      });
    });

    describe('completeMaintenance', () => {
      it('sets completedAt timestamp', async () => {
        const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Test maintenance');
        const beforeComplete = new Date();

        await completeMaintenance(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(maintenance).where(eq(maintenance.id, id));
        expect(result[0].completedAt).toBeDefined();
        expect(result[0].completedAt).toBeInstanceOf(Date);
        expect(result[0].completedAt!.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
      });

      it('does not affect other fields', async () => {
        const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Test maintenance');

        await completeMaintenance(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(maintenance).where(eq(maintenance.id, id));
        expect(result[0].date).toBe('Mon, Jan 1');
        expect(result[0].description).toBe('Test maintenance');
      });
    });
  });

  describe('Event Functions', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    describe('completeEvent', () => {
      it('sets status to completed', async () => {
        const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

        await completeEvent(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(events).where(eq(events.id, id));
        expect(result[0].status).toBe('completed');
      });

      it('sets completedAt timestamp', async () => {
        const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);
        const beforeComplete = new Date();

        await completeEvent(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(events).where(eq(events.id, id));
        expect(result[0].completedAt).toBeDefined();
        expect(result[0].completedAt).toBeInstanceOf(Date);
        expect(result[0].completedAt!.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
      });

      it('updates updatedAt timestamp', async () => {
        const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);
        const db = getTestDb();
        const before = await db.select().from(events).where(eq(events.id, id));
        const originalUpdatedAt = before[0].updatedAt;

        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        await completeEvent(id, testProperty.id);

        const after = await db.select().from(events).where(eq(events.id, id));
        expect(after[0].updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });

    describe('cancelEvent', () => {
      it('sets status to cancelled', async () => {
        const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

        await cancelEvent(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(events).where(eq(events.id, id));
        expect(result[0].status).toBe('cancelled');
      });

      it('does not set completedAt', async () => {
        const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

        await cancelEvent(id, testProperty.id);

        const db = getTestDb();
        const result = await db.select().from(events).where(eq(events.id, id));
        expect(result[0].completedAt).toBeNull();
      });

      it('updates updatedAt timestamp', async () => {
        const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);
        const db = getTestDb();
        const before = await db.select().from(events).where(eq(events.id, id));
        const originalUpdatedAt = before[0].updatedAt;

        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        await cancelEvent(id, testProperty.id);

        const after = await db.select().from(events).where(eq(events.id, id));
        expect(after[0].updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });
  });
});
