import { db } from './db';
import { systemStatus, issues, maintenance, announcements, config } from './schema';
import { eq, gte, or, isNull } from 'drizzle-orm';
import type { StatusPageData, SystemStatus, SystemStatusData } from '@/types';

/**
 * Get all status data for the main page
 */
export async function getStatusData(): Promise<StatusPageData> {
  // Fetch all data in parallel
  const [
    systemStatusData,
    issuesData,
    maintenanceData,
    announcementsData,
    contactsConfig,
    linksConfig,
    garbageConfig,
    buildingsConfig,
    systemsConfig,
    emailConfig,
  ] = await Promise.all([
    db.select().from(systemStatus),
    db.select().from(issues).where(isNull(issues.resolvedAt)), // Only unresolved
    db.select().from(maintenance).where(isNull(maintenance.completedAt)), // Only incomplete
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
