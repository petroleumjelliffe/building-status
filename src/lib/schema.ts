import { pgTable, serial, varchar, text, timestamp, jsonb, boolean, integer, index, primaryKey } from 'drizzle-orm/pg-core';

// Properties (co-ops/building complexes)
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).unique().notNull(), // e.g., "riverside-coop"
  hash: varchar('hash', { length: 64 }).unique().notNull(), // URL hash e.g., "abc123xyz"
  name: varchar('name', { length: 255 }).notNull(), // Display name e.g., "Riverside Co-op"
  createdAt: timestamp('created_at').defaultNow().notNull(),
  requireAuthForContacts: boolean('require_auth_for_contacts').default(false).notNull(), // Whether contact info requires authentication
}, (table) => ({
  propertyIdIdx: index('idx_properties_property_id').on(table.propertyId),
  hashIdx: index('idx_properties_hash').on(table.hash),
  requireAuthIdx: index('idx_properties_require_auth').on(table.requireAuthForContacts),
}));

// System status for each building
export const systemStatus = pgTable('system_status', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).default(1), // Default to first property for migration
  systemId: varchar('system_id', { length: 50 }).notNull(), // 'heat', 'water', 'laundry'
  status: varchar('status', { length: 20 }).notNull(), // 'ok', 'issue', 'down'
  count: varchar('count', { length: 10 }), // '2/3' or '3/3'
  note: text('note'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index('idx_system_status_property_id').on(table.propertyId),
}));

// Current issues
export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).default(1), // Default to first property for migration
  category: varchar('category', { length: 100 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 10 }),
  status: varchar('status', { length: 50 }).notNull(), // 'reported', 'investigating', 'resolved'
  detail: text('detail').notNull(),
  reportedAt: timestamp('reported_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => ({
  propertyIdIdx: index('idx_issues_property_id').on(table.propertyId),
}));

// Scheduled maintenance (legacy - will be replaced by events)
export const maintenance = pgTable('maintenance', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).default(1), // Default to first property for migration
  date: varchar('date', { length: 50 }).notNull(), // Human-readable like "Thu, Jan 8"
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'), // null = not completed, timestamp = completed
}, (table) => ({
  propertyIdIdx: index('idx_maintenance_property_id').on(table.propertyId),
}));

// Calendar events (replaces maintenance with proper timestamps)
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).default(1), // Default to first property for migration
  type: varchar('type', { length: 20 }).notNull(), // 'maintenance', 'announcement', 'outage'
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),

  // Timing (stored in UTC)
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at'),
  allDay: boolean('all_day').default(false),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),

  // Recurrence (RFC 5545 RRULE format)
  recurrenceRule: text('recurrence_rule'),

  // Status tracking
  status: varchar('status', { length: 20 }).default('scheduled'), // 'scheduled', 'in_progress', 'completed', 'cancelled'
  completedAt: timestamp('completed_at'),

  // Notification settings (array of minutes before event)
  notifyBeforeMinutes: integer('notify_before_minutes').array(),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 100 }),
}, (table) => ({
  propertyIdIdx: index('idx_events_property_id').on(table.propertyId),
}));

// Pinned announcements with auto-expiration
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).default(1), // Default to first property for migration
  type: varchar('type', { length: 20 }).notNull(), // 'warning', 'info', 'alert'
  message: text('message').notNull(),
  expiresAt: timestamp('expires_at'), // null = never expires
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index('idx_announcements_property_id').on(table.propertyId),
}));

// Static configuration (contacts, links, schedules)
// Stored as JSONB for flexibility
export const config = pgTable('config', {
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.propertyId, table.key] }),
  propertyIdIdx: index('idx_config_property_id').on(table.propertyId),
}));

// Example config key-value pairs:
// - 'contacts': [{ label: string, phone: string, hours: string }, ...]
// - 'helpfulLinks': [{ title: string, url: string, icon: string }, ...]
// - 'garbageSchedule': { trash: { days: string[], time?: string }, recycling: { days: string[], time?: string }, notes: string }
// - 'buildings': { '712': { name: string, units: string[], floors: number[] }, ... }
// - 'systems': [{ id: string, name: string, icon: string, label: string }, ...]
// - 'reportEmail': string

// QR code access tokens for residents
export const accessTokens = pgTable('access_tokens', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 64 }).unique().notNull(), // Access token in QR code
  label: varchar('label', { length: 255 }).notNull(), // e.g., "Building A - Main Entrance QR"
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // NULL = never expires
}, (table) => ({
  tokenIdx: index('idx_access_tokens_token').on(table.token),
  propertyIdIdx: index('idx_access_tokens_property').on(table.propertyId),
  activeIdx: index('idx_access_tokens_active').on(table.isActive),
}));

// Resident sessions from QR code scans
export const residentSessions = pgTable('resident_sessions', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  accessTokenId: integer('access_token_id').references(() => accessTokens.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: varchar('session_token', { length: 64 }).unique().notNull(), // Stored in localStorage
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // 90 days from creation
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionTokenIdx: index('idx_resident_sessions_token').on(table.sessionToken),
  propertyIdIdx: index('idx_resident_sessions_property').on(table.propertyId),
  expiresIdx: index('idx_resident_sessions_expires').on(table.expiresAt),
}));

// Notification subscriptions (board-invited + self-signup)
export const notificationSubscriptions = pgTable('notification_subscriptions', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  contactMethod: varchar('contact_method', { length: 10 }).notNull(), // 'email' or 'sms'
  contactValue: varchar('contact_value', { length: 255 }).notNull(), // email or phone
  source: varchar('source', { length: 10 }).notNull(), // 'board' or 'self'
  confirmationToken: varchar('confirmation_token', { length: 64 }).unique(),
  confirmedAt: timestamp('confirmed_at'), // NULL until confirmed
  approvalRequired: boolean('approval_required').default(false).notNull(),
  approvedBy: varchar('approved_by', { length: 255 }), // admin who approved
  approvedAt: timestamp('approved_at'), // when approved (NULL = pending)
  revokedAt: timestamp('revoked_at'), // NULL = active
  notifyNewIssues: boolean('notify_new_issues').default(true).notNull(),
  notifyUpcomingMaintenance: boolean('notify_upcoming_maintenance').default(true).notNull(),
  notifyNewAnnouncements: boolean('notify_new_announcements').default(true).notNull(),
  notifyStatusChanges: boolean('notify_status_changes').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index('idx_notif_subs_property').on(table.propertyId),
  activeIdx: index('idx_notif_subs_active').on(table.revokedAt),
  confirmedIdx: index('idx_notif_subs_confirmed').on(table.confirmedAt),
}));

// Notification queue for email/SMS notifications (optional - for reliable delivery)
export const notificationQueue = pgTable('notification_queue', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').references(() => notificationSubscriptions.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'new_issue', 'upcoming_maintenance', etc.
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'sent', 'failed'
  attempts: integer('attempts').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  sentAt: timestamp('sent_at'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('idx_notification_queue_status').on(table.status),
  subscriptionIdx: index('idx_notification_queue_subscription').on(table.subscriptionId),
}));
