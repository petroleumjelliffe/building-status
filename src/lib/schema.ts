import { pgTable, serial, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// System status for each building
export const systemStatus = pgTable('system_status', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).notNull(), // 'heat', 'water', 'laundry'
  status: varchar('status', { length: 20 }).notNull(), // 'ok', 'issue', 'down'
  count: varchar('count', { length: 10 }), // '2/3' or '3/3'
  note: text('note'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Current issues
export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 100 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 10 }),
  status: varchar('status', { length: 50 }).notNull(), // 'reported', 'investigating', 'resolved'
  detail: text('detail').notNull(),
  reportedAt: timestamp('reported_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// Scheduled maintenance
export const maintenance = pgTable('maintenance', {
  id: serial('id').primaryKey(),
  date: varchar('date', { length: 50 }).notNull(), // Human-readable like "Thu, Jan 8"
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'), // null = not completed, timestamp = completed
});

// Pinned announcements with auto-expiration
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 20 }).notNull(), // 'warning', 'info', 'alert'
  message: text('message').notNull(),
  expiresAt: timestamp('expires_at'), // null = never expires
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Static configuration (contacts, links, schedules)
// Stored as JSONB for flexibility
export const config = pgTable('config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Example config key-value pairs:
// - 'contacts': [{ label: string, phone: string, hours: string }, ...]
// - 'helpfulLinks': [{ title: string, url: string, icon: string }, ...]
// - 'garbageSchedule': { trash: { days: string[], time?: string }, recycling: { days: string[], time?: string }, notes: string }
// - 'buildings': { '712': { name: string, units: string[], floors: number[] }, ... }
// - 'systems': [{ id: string, name: string, icon: string, label: string }, ...]
// - 'reportEmail': string
