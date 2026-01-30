import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  createAnnouncement,
  createIssue,
  updateSystemStatus,
  createMaintenance,
  createEvent,
  updateEvent,
  deleteEvent,
  createContact,
  deleteContact,
  getContacts,
  createHelpfulLink,
  deleteHelpfulLink,
  getHelpfulLinks,
} from '@/lib/queries';
import { getTestDb, cleanDatabase, createTestProperty, closeTestDb } from '@/../test/db-utils';
import { announcements, issues, systemStatus, maintenance, events } from '@/lib/schema';
import { eq } from 'drizzle-orm';

describe('Medium Complexity Query Functions', () => {
  let testProperty: any;

  beforeEach(async () => {
    await cleanDatabase();
    testProperty = await createTestProperty();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('createAnnouncement', () => {
    it('returns generated ID', async () => {
      const id = await createAnnouncement(testProperty.id, 'info', 'Test message', undefined);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('creates announcement with all fields', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const id = await createAnnouncement(testProperty.id, 'warning', 'Important message', expiresAt);

      const db = getTestDb();
      const result = await db.select().from(announcements).where(eq(announcements.id, id));

      expect(result[0].type).toBe('warning');
      expect(result[0].message).toBe('Important message');
      expect(result[0].expiresAt).toEqual(expiresAt);
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('handles undefined expiresAt', async () => {
      const id = await createAnnouncement(testProperty.id, 'info', 'Permanent message', undefined);

      const db = getTestDb();
      const result = await db.select().from(announcements).where(eq(announcements.id, id));

      expect(result[0].expiresAt).toBeNull();
    });

    it('returns unique IDs for multiple announcements', async () => {
      const id1 = await createAnnouncement(testProperty.id, 'info', 'Message 1', undefined);
      const id2 = await createAnnouncement(testProperty.id, 'info', 'Message 2', undefined);
      const id3 = await createAnnouncement(testProperty.id, 'info', 'Message 3', undefined);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('createIssue', () => {
    it('returns generated ID', async () => {
      const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak detected', 'reported');

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('creates issue without icon', async () => {
      const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak detected', 'reported');

      const db = getTestDb();
      const result = await db.select().from(issues).where(eq(issues.id, id));

      expect(result[0].category).toBe('Plumbing');
      expect(result[0].location).toBe('Floor 2');
      expect(result[0].detail).toBe('Leak detected');
      expect(result[0].status).toBe('reported');
      expect(result[0].icon).toBeNull();
    });

    it('creates issue with icon', async () => {
      const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak detected', 'reported', '💧');

      const db = getTestDb();
      const result = await db.select().from(issues).where(eq(issues.id, id));

      expect(result[0].icon).toBe('💧');
    });

    it('injects reportedAt timestamp', async () => {
      const beforeCreate = new Date();
      const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak', 'reported');

      const db = getTestDb();
      const result = await db.select().from(issues).where(eq(issues.id, id));

      expect(result[0].reportedAt).toBeInstanceOf(Date);
      expect(result[0].reportedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });

    it('initializes resolvedAt as null', async () => {
      const id = await createIssue(testProperty.id, 'Plumbing', 'Floor 2', 'Leak', 'reported');

      const db = getTestDb();
      const result = await db.select().from(issues).where(eq(issues.id, id));

      expect(result[0].resolvedAt).toBeNull();
    });
  });

  describe('updateSystemStatus', () => {
    it('inserts new system status', async () => {
      await updateSystemStatus(testProperty.id, 'heat', 'ok', undefined, undefined);

      const db = getTestDb();
      const result = await db.select().from(systemStatus).where(eq(systemStatus.systemId, 'heat'));

      expect(result.length).toBe(1);
      expect(result[0].status).toBe('ok');
      expect(result[0].systemId).toBe('heat');
    });

    it('updates existing system status', async () => {
      // First insert
      await updateSystemStatus(testProperty.id, 'water', 'ok', '3/3', 'All systems operational');

      // Then update
      await updateSystemStatus(testProperty.id, 'water', 'issue', '2/3', 'One floor affected');

      const db = getTestDb();
      const result = await db.select().from(systemStatus).where(eq(systemStatus.systemId, 'water'));

      expect(result.length).toBe(1); // Should still be only one record
      expect(result[0].status).toBe('issue');
      expect(result[0].count).toBe('2/3');
      expect(result[0].note).toBe('One floor affected');
    });

    it('handles optional count and note', async () => {
      await updateSystemStatus(testProperty.id, 'laundry', 'ok', undefined, undefined);

      const db = getTestDb();
      const result = await db.select().from(systemStatus).where(eq(systemStatus.systemId, 'laundry'));

      expect(result[0].count).toBeNull();
      expect(result[0].note).toBeNull();
    });

    it('updates updatedAt timestamp on update', async () => {
      await updateSystemStatus(testProperty.id, 'heat', 'ok', undefined, undefined);

      const db = getTestDb();
      const firstResult = await db.select().from(systemStatus).where(eq(systemStatus.systemId, 'heat'));
      const firstUpdatedAt = firstResult[0].updatedAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      await updateSystemStatus(testProperty.id, 'heat', 'issue', undefined, 'Problem detected');

      const secondResult = await db.select().from(systemStatus).where(eq(systemStatus.systemId, 'heat'));
      const secondUpdatedAt = secondResult[0].updatedAt;

      expect(secondUpdatedAt.getTime()).toBeGreaterThan(firstUpdatedAt.getTime());
    });
  });

  describe('createMaintenance', () => {
    it('returns generated ID', async () => {
      const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Test maintenance');

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('injects createdAt timestamp', async () => {
      const beforeCreate = new Date();
      const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Test maintenance');

      const db = getTestDb();
      const result = await db.select().from(maintenance).where(eq(maintenance.id, id));

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });

    it('initializes completedAt as null', async () => {
      const id = await createMaintenance(testProperty.id, 'Mon, Jan 1', 'Test maintenance');

      const db = getTestDb();
      const result = await db.select().from(maintenance).where(eq(maintenance.id, id));

      expect(result[0].completedAt).toBeNull();
    });
  });

  describe('createEvent', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    it('returns generated ID', async () => {
      const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('creates event with minimal options', async () => {
      const id = await createEvent(testProperty.id, 'maintenance', 'Simple event', futureDate);

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));

      expect(result[0].type).toBe('maintenance');
      expect(result[0].title).toBe('Simple event');
      expect(result[0].startsAt).toEqual(futureDate);
      expect(result[0].allDay).toBe(false); // Default
      expect(result[0].timezone).toBe('America/New_York'); // Default
      expect(result[0].status).toBe('scheduled'); // Default
    });

    it('applies default values for optional fields', async () => {
      const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate, {});

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));

      expect(result[0].allDay).toBe(false);
      expect(result[0].timezone).toBe('America/New_York');
      expect(result[0].status).toBe('scheduled');
    });

    it('creates event with all options', async () => {
      const endsAt = new Date(futureDate.getTime() + 2 * 60 * 60 * 1000);
      const id = await createEvent(testProperty.id, 'outage', 'Power outage', futureDate, {
        description: 'Scheduled power maintenance',
        endsAt,
        allDay: true,
        timezone: 'America/Los_Angeles',
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
        notifyBeforeMinutes: [60, 1440],
        createdBy: 'admin@example.com',
      });

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));

      expect(result[0].description).toBe('Scheduled power maintenance');
      expect(result[0].endsAt).toEqual(endsAt);
      expect(result[0].allDay).toBe(true);
      expect(result[0].timezone).toBe('America/Los_Angeles');
      expect(result[0].recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=MO');
      expect(result[0].notifyBeforeMinutes).toEqual([60, 1440]);
      expect(result[0].createdBy).toBe('admin@example.com');
    });

    it('injects timestamps', async () => {
      const beforeCreate = new Date();
      const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result[0].updatedAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });
  });

  describe('updateEvent', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    it('merges partial updates correctly', async () => {
      const id = await createEvent(testProperty.id, 'maintenance', 'Original title', futureDate, {
        description: 'Original description',
        allDay: false,
        timezone: 'America/New_York',
      });

      await updateEvent(id, testProperty.id, {
        title: 'Updated title',
        allDay: true,
      });

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));

      expect(result[0].title).toBe('Updated title'); // Updated
      expect(result[0].allDay).toBe(true); // Updated
      expect(result[0].description).toBe('Original description'); // Unchanged
      expect(result[0].timezone).toBe('America/New_York'); // Unchanged
    });

    it('updates single field', async () => {
      const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

      await updateEvent(id, testProperty.id, { status: 'in_progress' });

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));

      expect(result[0].status).toBe('in_progress');
      expect(result[0].title).toBe('Test event'); // Unchanged
    });

    it('can set nullable fields to null', async () => {
      const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate, {
        description: 'Has description',
        recurrenceRule: 'FREQ=WEEKLY',
      });

      await updateEvent(id, testProperty.id, {
        endsAt: null,
        recurrenceRule: null,
      });

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));

      expect(result[0].endsAt).toBeNull();
      expect(result[0].recurrenceRule).toBeNull();
    });

    it('updates updatedAt timestamp', async () => {
      const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

      const db = getTestDb();
      const before = await db.select().from(events).where(eq(events.id, id));
      const originalUpdatedAt = before[0].updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      await updateEvent(id, testProperty.id, { title: 'Updated' });

      const after = await db.select().from(events).where(eq(events.id, id));
      expect(after[0].updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('deleteEvent', () => {
    it('permanently deletes event', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const id = await createEvent(testProperty.id, 'maintenance', 'Test event', futureDate);

      await deleteEvent(id, testProperty.id);

      const db = getTestDb();
      const result = await db.select().from(events).where(eq(events.id, id));
      expect(result.length).toBe(0);
    });

    it('only deletes specified event', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const id1 = await createEvent(testProperty.id, 'maintenance', 'Event 1', futureDate);
      const id2 = await createEvent(testProperty.id, 'outage', 'Event 2', futureDate);

      await deleteEvent(id1, testProperty.id);

      const db = getTestDb();
      const remaining = await db.select().from(events);
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(id2);
    });
  });

  describe('Contact Array Operations', () => {
    describe('deleteContact', () => {
      it('removes contact from array', async () => {
        const id1 = await createContact('Super', '24/7', testProperty.id, '555-0001');
        const id2 = await createContact('Manager', '9-5', testProperty.id, '555-0002');

        await deleteContact(id1, testProperty.id);

        const contacts = await getContacts(testProperty.id);
        expect(contacts.length).toBe(1);
        expect(contacts[0].id).toBe(id2);
      });

      it('preserves other contacts', async () => {
        const id1 = await createContact('Super', '24/7', testProperty.id, '555-0001');
        const id2 = await createContact('Manager', '9-5', testProperty.id, '555-0002');
        const id3 = await createContact('Security', '24/7', testProperty.id, '555-0003');

        await deleteContact(id2, testProperty.id);

        const contacts = await getContacts(testProperty.id);
        expect(contacts.length).toBe(2);
        expect(contacts.find((c: any) => c.id === id1)).toBeDefined();
        expect(contacts.find((c: any) => c.id === id3)).toBeDefined();
      });

      it('handles deleting non-existent contact', async () => {
        const id = await createContact('Super', '24/7', testProperty.id, '555-0001');

        await deleteContact('non-existent-id', testProperty.id);

        const contacts = await getContacts(testProperty.id);
        expect(contacts.length).toBe(1);
        expect(contacts[0].id).toBe(id);
      });
    });
  });

  describe('Helpful Link Array Operations', () => {
    describe('deleteHelpfulLink', () => {
      it('removes link from array', async () => {
        const id1 = await createHelpfulLink('Google', 'https://google.com', '🔍', testProperty.id);
        const id2 = await createHelpfulLink('GitHub', 'https://github.com', '🐙', testProperty.id);

        await deleteHelpfulLink(id1, testProperty.id);

        const links = await getHelpfulLinks(testProperty.id);
        expect(links.length).toBe(1);
        expect(links[0].id).toBe(id2);
      });

      it('preserves other links', async () => {
        const id1 = await createHelpfulLink('Link 1', 'https://one.com', '1️⃣', testProperty.id);
        const id2 = await createHelpfulLink('Link 2', 'https://two.com', '2️⃣', testProperty.id);
        const id3 = await createHelpfulLink('Link 3', 'https://three.com', '3️⃣', testProperty.id);

        await deleteHelpfulLink(id2, testProperty.id);

        const links = await getHelpfulLinks(testProperty.id);
        expect(links.length).toBe(2);
        expect(links.find((l: any) => l.id === id1)).toBeDefined();
        expect(links.find((l: any) => l.id === id3)).toBeDefined();
      });

      it('handles deleting non-existent link', async () => {
        const id = await createHelpfulLink('Google', 'https://google.com', '🔍', testProperty.id);

        await deleteHelpfulLink('non-existent-id', testProperty.id);

        const links = await getHelpfulLinks(testProperty.id);
        expect(links.length).toBe(1);
        expect(links[0].id).toBe(id);
      });
    });
  });
});
