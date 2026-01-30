import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  getStatusData,
  getUpcomingEvents,
  createContact,
  updateContact,
  getContacts,
  createHelpfulLink,
  updateHelpfulLink,
  getHelpfulLinks,
  createIssue,
  resolveIssue,
  createAnnouncement,
  createEvent,
  setConfigValue,
  updateSystemStatus,
} from '@/lib/queries';
import { getTestDb, cleanDatabase, createTestProperty, closeTestDb } from '@/../test/db-utils';
import { issues } from '@/lib/schema';
import { eq } from 'drizzle-orm';

describe('Complex Query Functions - Business Logic', () => {
  let testProperty: any;

  beforeEach(async () => {
    await cleanDatabase();
    testProperty = await createTestProperty();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('getStatusData', () => {
    it('returns all data sections for property', async () => {
      const result = await getStatusData(testProperty.id);

      expect(result).toHaveProperty('systemStatus');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('maintenance');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('announcements');
      expect(result).toHaveProperty('contacts');
      expect(result).toHaveProperty('helpfulLinks');
      expect(result).toHaveProperty('garbageSchedule');
      expect(result).toHaveProperty('buildings');
      expect(result).toHaveProperty('systems');
      expect(result).toHaveProperty('reportEmail');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('returns default values for missing config', async () => {
      const result = await getStatusData(testProperty.id);

      expect(result.contacts).toEqual([]);
      expect(result.helpfulLinks).toEqual([]);
      expect(result.garbageSchedule).toEqual({
        trash: { days: [] },
        recycling: { days: [] },
        notes: ''
      });
      expect(result.reportEmail).toBe('building-status@example.com');
      expect(result.buildings).toEqual({});
      expect(result.systems).toEqual([]);
    });

    it('returns configured values when present', async () => {
      // Set up config
      await setConfigValue('contacts', [
        { id: 'c1', label: 'Super', phone: '555-0001', hours: '24/7' }
      ], testProperty.id);
      await setConfigValue('helpfulLinks', [
        { id: 'l1', title: 'Portal', url: 'https://portal.com', icon: '🔗' }
      ], testProperty.id);
      await setConfigValue('reportEmail', 'custom@example.com', testProperty.id);

      const result = await getStatusData(testProperty.id);

      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].label).toBe('Super');
      expect(result.helpfulLinks).toHaveLength(1);
      expect(result.helpfulLinks[0].title).toBe('Portal');
      expect(result.reportEmail).toBe('custom@example.com');
    });

    it('filters resolved issues older than 24 hours', async () => {
      // Create old resolved issue
      const oldResolvedId = await createIssue(testProperty.id, 'Old', 'Location', 'Detail', 'resolved');
      const db = getTestDb();
      const twentySixHoursAgo = new Date(Date.now() - 26 * 60 * 60 * 1000);
      await db.update(issues)
        .set({ resolvedAt: twentySixHoursAgo })
        .where(eq(issues.id, oldResolvedId));

      // Create recent resolved issue
      const recentResolvedId = await createIssue(testProperty.id, 'Recent', 'Location', 'Detail', 'resolved');
      await resolveIssue(recentResolvedId, testProperty.id);

      // Create unresolved issue
      const unresolvedId = await createIssue(testProperty.id, 'Unresolved', 'Location', 'Detail', 'reported');

      const result = await getStatusData(testProperty.id);

      expect(result.issues.find((i: any) => i.id === oldResolvedId)).toBeUndefined();
      expect(result.issues.find((i: any) => i.id === recentResolvedId)).toBeDefined();
      expect(result.issues.find((i: any) => i.id === unresolvedId)).toBeDefined();
    });

    it('only shows non-expired announcements', async () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const expiredId = await createAnnouncement(testProperty.id, 'info', 'Expired', pastDate);
      const activeId = await createAnnouncement(testProperty.id, 'warning', 'Active', futureDate);
      const permanentId = await createAnnouncement(testProperty.id, 'alert', 'Permanent', undefined);

      const result = await getStatusData(testProperty.id);

      expect(result.announcements.find((a: any) => a.id === expiredId)).toBeUndefined();
      expect(result.announcements.find((a: any) => a.id === activeId)).toBeDefined();
      expect(result.announcements.find((a: any) => a.id === permanentId)).toBeDefined();
    });

    it('only shows scheduled and in_progress events', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const scheduledId = await createEvent(testProperty.id, 'maintenance', 'Scheduled', futureDate);

      const result = await getStatusData(testProperty.id);

      expect(result.events.find((e: any) => e.id === scheduledId)).toBeDefined();
    });

    it('sets lastUpdated to current time', async () => {
      const beforeCall = new Date();
      const result = await getStatusData(testProperty.id);
      const afterCall = new Date();

      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.lastUpdated.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('getUpcomingEvents', () => {
    it('includes events from 7 days ago to 90 days in future', async () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const eightyDaysFromNow = new Date(Date.now() + 80 * 24 * 60 * 60 * 1000);

      const id1 = await createEvent(testProperty.id, 'maintenance', 'Recent past', sixDaysAgo);
      const id2 = await createEvent(testProperty.id, 'maintenance', 'Near future', eightyDaysFromNow);

      const result = await getUpcomingEvents(testProperty.id);

      expect(result.find((e: any) => e.id === id1)).toBeDefined();
      expect(result.find((e: any) => e.id === id2)).toBeDefined();
    });

    it('excludes events older than 7 days', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const id = await createEvent(testProperty.id, 'maintenance', 'Old event', eightDaysAgo);

      const result = await getUpcomingEvents(testProperty.id);

      expect(result.find((e: any) => e.id === id)).toBeUndefined();
    });

    it('excludes events more than 90 days in future', async () => {
      const ninetyOneDaysFromNow = new Date(Date.now() + 91 * 24 * 60 * 60 * 1000);
      const id = await createEvent(testProperty.id, 'maintenance', 'Far future', ninetyOneDaysFromNow);

      const result = await getUpcomingEvents(testProperty.id);

      expect(result.find((e: any) => e.id === id)).toBeUndefined();
    });

    it('filters by event type when specified', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const maintenanceId = await createEvent(testProperty.id, 'maintenance', 'Maintenance', futureDate);
      const outageId = await createEvent(testProperty.id, 'outage', 'Outage', futureDate);
      const announcementId = await createEvent(testProperty.id, 'announcement', 'Announcement', futureDate);

      const maintenanceOnly = await getUpcomingEvents(testProperty.id, ['maintenance']);
      const maintenanceAndOutage = await getUpcomingEvents(testProperty.id, ['maintenance', 'outage']);

      expect(maintenanceOnly.find((e: any) => e.id === maintenanceId)).toBeDefined();
      expect(maintenanceOnly.find((e: any) => e.id === outageId)).toBeUndefined();
      expect(maintenanceOnly.find((e: any) => e.id === announcementId)).toBeUndefined();

      expect(maintenanceAndOutage.find((e: any) => e.id === maintenanceId)).toBeDefined();
      expect(maintenanceAndOutage.find((e: any) => e.id === outageId)).toBeDefined();
      expect(maintenanceAndOutage.find((e: any) => e.id === announcementId)).toBeUndefined();
    });

    it('returns all types when no filter specified', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const id1 = await createEvent(testProperty.id, 'maintenance', 'Event 1', futureDate);
      const id2 = await createEvent(testProperty.id, 'outage', 'Event 2', futureDate);
      const id3 = await createEvent(testProperty.id, 'announcement', 'Event 3', futureDate);

      const result = await getUpcomingEvents(testProperty.id);

      expect(result.find((e: any) => e.id === id1)).toBeDefined();
      expect(result.find((e: any) => e.id === id2)).toBeDefined();
      expect(result.find((e: any) => e.id === id3)).toBeDefined();
    });

    it('orders events by startsAt ascending', async () => {
      const date1 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const date2 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      const date3 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      await createEvent(testProperty.id, 'maintenance', 'Event 3 days', date1);
      await createEvent(testProperty.id, 'maintenance', 'Event 1 day', date2);
      await createEvent(testProperty.id, 'maintenance', 'Event 5 days', date3);

      const result = await getUpcomingEvents(testProperty.id);

      expect(result[0].title).toBe('Event 1 day');
      expect(result[1].title).toBe('Event 3 days');
      expect(result[2].title).toBe('Event 5 days');
    });
  });

  describe('Contact Functions - ID Generation & Array Operations', () => {
    describe('createContact', () => {
      it('generates unique ID with timestamp pattern', async () => {
        const id = await createContact('Super', '24/7', testProperty.id, '555-0001');

        expect(id).toMatch(/^contact-\d+$/);
      });

      it('generates unique IDs for sequential creates', async () => {
        const id1 = await createContact('Super', '24/7', testProperty.id, '555-0001');
        const id2 = await createContact('Manager', '9-5', testProperty.id, '555-0002');
        const id3 = await createContact('Security', '24/7', testProperty.id, '555-0003');

        expect(id1).not.toBe(id2);
        expect(id2).not.toBe(id3);
        expect(id1).not.toBe(id3);
      });

      it('appends to existing array', async () => {
        await createContact('Contact 1', '24/7', testProperty.id, '555-0001');
        await createContact('Contact 2', '9-5', testProperty.id, '555-0002');

        const contacts = await getContacts(testProperty.id);
        expect(contacts.length).toBe(2);
      });

      it('handles optional phone/email fields', async () => {
        const id1 = await createContact('Contact 1', '24/7', testProperty.id, '555-0001');
        const id2 = await createContact('Contact 2', '9-5', testProperty.id, undefined, 'email@example.com');

        const contacts = await getContacts(testProperty.id);

        const contact1 = contacts.find((c: any) => c.id === id1);
        expect(contact1.phone).toBe('555-0001');
        expect(contact1.email).toBeUndefined();

        const contact2 = contacts.find((c: any) => c.id === id2);
        expect(contact2.phone).toBeUndefined();
        expect(contact2.email).toBe('email@example.com');
      });
    });

    describe('updateContact', () => {
      it('transforms array with spread operator preserving unchanged fields', async () => {
        const id = await createContact('Super', '24/7', testProperty.id, '555-0001', 'super@example.com');

        await updateContact(id, { hours: '24/7 Emergency' }, testProperty.id);

        const contacts = await getContacts(testProperty.id);
        const updated = contacts.find((c: any) => c.id === id);

        expect(updated.label).toBe('Super'); // Unchanged
        expect(updated.phone).toBe('555-0001'); // Unchanged
        expect(updated.email).toBe('super@example.com'); // Unchanged
        expect(updated.hours).toBe('24/7 Emergency'); // Updated
      });

      it('updates multiple fields at once', async () => {
        const id = await createContact('Super', '24/7', testProperty.id, '555-0001');

        await updateContact(id, {
          label: 'Building Super',
          phone: '555-9999',
          hours: 'On-call 24/7'
        }, testProperty.id);

        const contacts = await getContacts(testProperty.id);
        const updated = contacts.find((c: any) => c.id === id);

        expect(updated.label).toBe('Building Super');
        expect(updated.phone).toBe('555-9999');
        expect(updated.hours).toBe('On-call 24/7');
      });

      it('only updates specified contact in array', async () => {
        const id1 = await createContact('Contact 1', '24/7', testProperty.id, '555-0001');
        const id2 = await createContact('Contact 2', '9-5', testProperty.id, '555-0002');
        const id3 = await createContact('Contact 3', '24/7', testProperty.id, '555-0003');

        await updateContact(id2, { label: 'Updated Contact 2' }, testProperty.id);

        const contacts = await getContacts(testProperty.id);

        expect(contacts[0].label).toBe('Contact 1'); // Unchanged
        expect(contacts[1].label).toBe('Updated Contact 2'); // Updated
        expect(contacts[2].label).toBe('Contact 3'); // Unchanged
      });
    });
  });

  describe('Helpful Link Functions - ID Generation & Array Operations', () => {
    describe('createHelpfulLink', () => {
      it('generates unique ID with timestamp pattern', async () => {
        const id = await createHelpfulLink('Portal', 'https://portal.com', '🔗', testProperty.id);

        expect(id).toMatch(/^link-\d+$/);
      });

      it('generates unique IDs for sequential creates', async () => {
        const id1 = await createHelpfulLink('Link 1', 'https://one.com', '1️⃣', testProperty.id);
        const id2 = await createHelpfulLink('Link 2', 'https://two.com', '2️⃣', testProperty.id);
        const id3 = await createHelpfulLink('Link 3', 'https://three.com', '3️⃣', testProperty.id);

        expect(id1).not.toBe(id2);
        expect(id2).not.toBe(id3);
        expect(id1).not.toBe(id3);
      });

      it('appends to existing array', async () => {
        await createHelpfulLink('Link 1', 'https://one.com', '1️⃣', testProperty.id);
        await createHelpfulLink('Link 2', 'https://two.com', '2️⃣', testProperty.id);

        const links = await getHelpfulLinks(testProperty.id);
        expect(links.length).toBe(2);
      });
    });

    describe('updateHelpfulLink', () => {
      it('transforms array with spread operator preserving unchanged fields', async () => {
        const id = await createHelpfulLink('Portal', 'https://portal.com', '🔗', testProperty.id);

        await updateHelpfulLink(id, { title: 'Resident Portal' }, testProperty.id);

        const links = await getHelpfulLinks(testProperty.id);
        const updated = links.find((l: any) => l.id === id);

        expect(updated.title).toBe('Resident Portal'); // Updated
        expect(updated.url).toBe('https://portal.com'); // Unchanged
        expect(updated.icon).toBe('🔗'); // Unchanged
      });

      it('updates multiple fields at once', async () => {
        const id = await createHelpfulLink('Portal', 'https://portal.com', '🔗', testProperty.id);

        await updateHelpfulLink(id, {
          title: 'New Portal',
          url: 'https://newportal.com',
          icon: '🚪'
        }, testProperty.id);

        const links = await getHelpfulLinks(testProperty.id);
        const updated = links.find((l: any) => l.id === id);

        expect(updated.title).toBe('New Portal');
        expect(updated.url).toBe('https://newportal.com');
        expect(updated.icon).toBe('🚪');
      });

      it('only updates specified link in array', async () => {
        const id1 = await createHelpfulLink('Link 1', 'https://one.com', '1️⃣', testProperty.id);
        const id2 = await createHelpfulLink('Link 2', 'https://two.com', '2️⃣', testProperty.id);
        const id3 = await createHelpfulLink('Link 3', 'https://three.com', '3️⃣', testProperty.id);

        await updateHelpfulLink(id2, { title: 'Updated Link 2' }, testProperty.id);

        const links = await getHelpfulLinks(testProperty.id);

        expect(links[0].title).toBe('Link 1'); // Unchanged
        expect(links[1].title).toBe('Updated Link 2'); // Updated
        expect(links[2].title).toBe('Link 3'); // Unchanged
      });
    });
  });
});
