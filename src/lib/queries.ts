import { db } from './db';
import { systemStatus, issues, maintenance, announcements, config, events } from './schema';
import { eq, gte, or, isNull, and, lte, asc, desc, ne } from 'drizzle-orm';
import type { StatusPageData, SystemStatus, SystemStatusData, CalendarEvent, EventType, EventStatus } from '@/types';

/**
 * Get all status data for the main page
 */
export async function getStatusData(): Promise<StatusPageData> {
  // Calculate 24 hours ago for visibility window
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fetch all data in parallel
  const [
    systemStatusData,
    issuesData,
    maintenanceData,
    eventsData,
    announcementsData,
    contactsConfig,
    linksConfig,
    garbageConfig,
    buildingsConfig,
    systemsConfig,
    emailConfig,
  ] = await Promise.all([
    db.select().from(systemStatus),
    // Show unresolved issues OR resolved issues from last 24 hours
    db.select().from(issues).where(
      or(
        isNull(issues.resolvedAt),
        gte(issues.resolvedAt, twentyFourHoursAgo)
      )
    ),
    db.select().from(maintenance).where(isNull(maintenance.completedAt)), // Only incomplete
    // Scheduled events (not completed/cancelled)
    db.select().from(events).where(
      or(
        eq(events.status, 'scheduled'),
        eq(events.status, 'in_progress')
      )
    ).orderBy(asc(events.startsAt)),
    db.select().from(announcements).where(
      or(
        isNull(announcements.expiresAt),
        gte(announcements.expiresAt, new Date())
      )
    ), // Only non-expired or permanent (null expiresAt)
    getConfigValue('contacts'),
    getConfigValue('helpfulLinks'),
    getConfigValue('garbageSchedule'),
    getConfigValue('buildings'),
    getConfigValue('systems'),
    getConfigValue('reportEmail'),
  ]);

  return {
    systemStatus: systemStatusData as SystemStatusData[],
    issues: issuesData as any, // TODO: Properly type Drizzle query results
    maintenance: maintenanceData,
    events: eventsData as CalendarEvent[],
    announcements: announcementsData as any, // TODO: Properly type Drizzle query results
    contacts: contactsConfig || [],
    helpfulLinks: linksConfig || [],
    garbageSchedule: garbageConfig || { trash: { days: [] }, recycling: { days: [] }, notes: '' },
    buildings: buildingsConfig || {},
    systems: systemsConfig || [],
    reportEmail: emailConfig || 'building-status@example.com',
    lastUpdated: new Date(),
  };
}

/**
 * Get a specific config value by key
 */
export async function getConfigValue<T = any>(key: string): Promise<T | null> {
  const result = await db.select().from(config).where(eq(config.key, key));
  return result[0]?.value as T || null;
}

/**
 * Update a config value
 */
export async function setConfigValue(key: string, value: any): Promise<void> {
  await db
    .insert(config)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: config.key,
      set: { value, updatedAt: new Date() },
    });
}

/**
 * Update system status
 */
export async function updateSystemStatus(
  systemId: string,
  status: SystemStatus,
  count?: string,
  note?: string
): Promise<void> {
  // Check if exists
  const existing = await db
    .select()
    .from(systemStatus)
    .where(eq(systemStatus.systemId, systemId));

  if (existing.length > 0) {
    // Update
    await db
      .update(systemStatus)
      .set({
        status,
        count,
        note,
        updatedAt: new Date(),
      })
      .where(eq(systemStatus.systemId, systemId));
  } else {
    // Insert
    await db.insert(systemStatus).values({
      systemId,
      status,
      count,
      note,
      updatedAt: new Date(),
    });
  }
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(
  type: string,
  message: string,
  expiresAt?: Date
): Promise<number> {
  const result = await db
    .insert(announcements)
    .values({
      type,
      message,
      expiresAt,
      createdAt: new Date(),
    })
    .returning({ id: announcements.id });

  return result[0].id;
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(
  id: number,
  updates: {
    type?: string;
    message?: string;
    expiresAt?: Date | null;
  }
): Promise<void> {
  await db
    .update(announcements)
    .set(updates)
    .where(eq(announcements.id, id));
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: number): Promise<void> {
  await db.delete(announcements).where(eq(announcements.id, id));
}

/**
 * Create a new issue
 */
export async function createIssue(
  category: string,
  location: string,
  detail: string,
  status: string,
  icon?: string
): Promise<number> {
  const result = await db
    .insert(issues)
    .values({
      category,
      location,
      detail,
      status,
      icon,
      reportedAt: new Date(),
    })
    .returning({ id: issues.id });

  return result[0].id;
}

/**
 * Update an issue
 */
export async function updateIssue(
  id: number,
  updates: {
    category?: string;
    location?: string;
    detail?: string;
    status?: string;
    icon?: string;
  }
): Promise<void> {
  await db
    .update(issues)
    .set(updates)
    .where(eq(issues.id, id));
}

/**
 * Resolve an issue (soft delete)
 */
export async function resolveIssue(id: number): Promise<void> {
  await db
    .update(issues)
    .set({ resolvedAt: new Date() })
    .where(eq(issues.id, id));
}

/**
 * Create a new maintenance item
 */
export async function createMaintenance(
  date: string,
  description: string
): Promise<number> {
  const result = await db
    .insert(maintenance)
    .values({
      date,
      description,
      createdAt: new Date(),
    })
    .returning({ id: maintenance.id });

  return result[0].id;
}

/**
 * Update a maintenance item
 */
export async function updateMaintenance(
  id: number,
  updates: {
    date?: string;
    description?: string;
  }
): Promise<void> {
  await db
    .update(maintenance)
    .set(updates)
    .where(eq(maintenance.id, id));
}

/**
 * Complete a maintenance item (soft delete)
 */
export async function completeMaintenance(id: number): Promise<void> {
  await db
    .update(maintenance)
    .set({ completedAt: new Date() })
    .where(eq(maintenance.id, id));
}

// ============================================
// Calendar Events CRUD
// ============================================

/**
 * Get upcoming events (for calendar feed and display)
 * Includes events starting in the past 7 days up to 90 days in the future
 */
export async function getUpcomingEvents(types?: EventType[]): Promise<CalendarEvent[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  let query = db
    .select()
    .from(events)
    .where(
      and(
        gte(events.startsAt, sevenDaysAgo),
        lte(events.startsAt, ninetyDaysFromNow),
        ne(events.status, 'cancelled')
      )
    )
    .orderBy(asc(events.startsAt));

  const result = await query;

  // Filter by type if specified
  if (types && types.length > 0) {
    return result.filter(e => types.includes(e.type as EventType)) as CalendarEvent[];
  }

  return result as CalendarEvent[];
}

/**
 * Get all scheduled (not completed/cancelled) events for display
 */
export async function getScheduledEvents(): Promise<CalendarEvent[]> {
  const result = await db
    .select()
    .from(events)
    .where(
      or(
        eq(events.status, 'scheduled'),
        eq(events.status, 'in_progress')
      )
    )
    .orderBy(asc(events.startsAt));

  return result as CalendarEvent[];
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: number): Promise<CalendarEvent | null> {
  const result = await db
    .select()
    .from(events)
    .where(eq(events.id, id));

  return result[0] as CalendarEvent || null;
}

/**
 * Create a new calendar event
 */
export async function createEvent(
  type: EventType,
  title: string,
  startsAt: Date,
  options?: {
    description?: string;
    endsAt?: Date;
    allDay?: boolean;
    timezone?: string;
    recurrenceRule?: string;
    notifyBeforeMinutes?: number[];
    createdBy?: string;
  }
): Promise<number> {
  const result = await db
    .insert(events)
    .values({
      type,
      title,
      startsAt,
      description: options?.description,
      endsAt: options?.endsAt,
      allDay: options?.allDay ?? false,
      timezone: options?.timezone ?? 'America/New_York',
      recurrenceRule: options?.recurrenceRule,
      notifyBeforeMinutes: options?.notifyBeforeMinutes,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options?.createdBy,
    })
    .returning({ id: events.id });

  return result[0].id;
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(
  id: number,
  updates: {
    type?: EventType;
    title?: string;
    description?: string;
    startsAt?: Date;
    endsAt?: Date | null;
    allDay?: boolean;
    timezone?: string;
    recurrenceRule?: string | null;
    status?: EventStatus;
    notifyBeforeMinutes?: number[] | null;
  }
): Promise<void> {
  await db
    .update(events)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));
}

/**
 * Mark an event as completed
 */
export async function completeEvent(id: number): Promise<void> {
  await db
    .update(events)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));
}

/**
 * Mark an event as cancelled
 */
export async function cancelEvent(id: number): Promise<void> {
  await db
    .update(events)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));
}

/**
 * Delete an event permanently
 */
export async function deleteEvent(id: number): Promise<void> {
  await db.delete(events).where(eq(events.id, id));
}
