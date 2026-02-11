# ADR 004: Calendar Events and Subscriber Notifications

## Status
**Accepted** - Phase 1 complete, Phase 2 in development

## Context

The current system has limitations:
- **Maintenance dates** were stored as freeform strings ("Thu, Jan 8") with no machine-readable timestamps
- **No subscriber system** - residents must manually check the status page
- **No calendar integration** - can't sync maintenance schedules to personal calendars
- **No resident identity** - QR code access is anonymous with no way to associate a resident with a unit or contact them

Residents have requested:
1. Calendar feed (iCal/webcal) for maintenance schedules
2. Notifications when issues are reported or resolved
3. Reminders before scheduled maintenance
4. Ability to report issues directly

## Decision

### Part 1: Calendar Events Schema (Complete)

Transform maintenance and announcements into proper calendar events with timestamps.

#### `events` Table

Replaces the `maintenance` table with a flexible event model:

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id),
  type VARCHAR(20) NOT NULL,        -- 'maintenance', 'announcement', 'outage'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,
  all_day BOOLEAN DEFAULT false,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  recurrence_rule TEXT,             -- RFC 5545 RRULE format
  status VARCHAR(20) DEFAULT 'scheduled',
  completed_at TIMESTAMP,
  notify_before_minutes INTEGER[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100)
);
```

#### iCal Feed

Public calendar feed at `GET /api/[propertyHash]/calendar.ics` using `ical-generator`. Supports webcal:// subscription links for Apple Calendar and Google Calendar.

**Status:** Implemented and deployed. Events table, iCal feed, RRULE recurrence, CalendarSubscribe UI all shipped.

---

### Part 2: Resident Identity and Email Notifications

Notification signup creates a **resident identity** -- an email address mapped to a property and optional unit, authenticated via magic link. This serves as the foundation for all resident-facing features.

#### Design Principles

1. **Subscriber = Resident Identity.** Signing up for notifications creates an identified account. No separate user/resident table -- the subscription record IS the identity.
2. **Passwordless Auth.** Residents authenticate via magic link sent to their email. No passwords to remember or manage.
3. **Session Priority.** When a device has both a subscriber session (identified) and a QR session (anonymous), the subscriber session takes precedence. QR remains for anonymous read-only access.
4. **Progressive Trust.** Any confirmed subscriber receives notifications. Admin approval unlocks additional capabilities (issue submission). Revocation removes all access.
5. **Token Separation.** Auth tokens (session) and email tokens (unsubscribe) are kept separate so that a forwarded email never leaks session access.

#### Schema

The `notification_subscriptions` table (already deployed) serves as the resident identity:

```sql
-- Already deployed
CREATE TABLE notification_subscriptions (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  contact_method VARCHAR(10) NOT NULL,    -- 'email' (SMS future)
  contact_value VARCHAR(255) NOT NULL,    -- email address
  source VARCHAR(10) NOT NULL,            -- 'board' (invited) or 'self' (signup)
  confirmation_token VARCHAR(64) UNIQUE,  -- used for initial email confirmation + unsubscribe links
  confirmed_at TIMESTAMP,
  approval_required BOOLEAN DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  revoked_at TIMESTAMP,
  notify_new_issues BOOLEAN DEFAULT true,
  notify_upcoming_maintenance BOOLEAN DEFAULT true,
  notify_new_announcements BOOLEAN DEFAULT true,
  notify_status_changes BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migration required
ALTER TABLE notification_subscriptions ADD COLUMN unit VARCHAR(50);
ALTER TABLE notification_subscriptions ADD COLUMN session_token VARCHAR(64) UNIQUE;

-- Prevent duplicate active subscriptions for the same email at the same property
CREATE UNIQUE INDEX idx_notif_subs_unique_active
  ON notification_subscriptions(property_id, contact_value)
  WHERE revoked_at IS NULL;
```

**Token responsibilities (separated):**

| Token | Lifetime | Purpose | Exposure |
|-------|----------|---------|----------|
| `confirmation_token` | Permanent | Initial email confirmation link; one-click unsubscribe link in email footers | Appears in every notification email |
| `session_token` | Rotated on each magic link login | Bearer token for API requests; stored in localStorage | Never leaves the client device |
| `magic_link_tokens.token` | 15 minutes, single-use | Gateway to obtain a `session_token` | Appears once in a magic link email |

This separation ensures that if a resident forwards an email, the recipient can at most unsubscribe them (low-severity, reversible) but cannot impersonate their session.

New table for passwordless authentication:

```sql
CREATE TABLE magic_link_tokens (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES notification_subscriptions(id) ON DELETE CASCADE NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,        -- 15 minutes from creation
  used_at TIMESTAMP,                    -- NULL until clicked
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_magic_link_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_link_expires ON magic_link_tokens(expires_at);
```

The `notification_queue` table (already deployed) handles async delivery:

```sql
-- Already deployed
CREATE TABLE notification_queue (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES notification_subscriptions(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'sent', 'failed'
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration required: add batch_key for future digest/batching support
ALTER TABLE notification_queue ADD COLUMN batch_key VARCHAR(100);
```

The `batch_key` column is unused initially but enables future digest mode. When multiple notifications share a `batch_key` (e.g., `"property_5_issues_2026-02-11"`), a future processor can collapse them into a single digest email instead of sending individually. Adding the column now avoids a migration later.

#### Authentication Flow

**Initial signup:**
1. Resident enters email (+ optional unit) on status page
2. System creates subscription record with `confirmation_token` and null `session_token`
3. Verification email sent with confirm link containing `confirmation_token`
4. Resident clicks link -> `confirmed_at` set, `session_token` generated and returned to client
5. Client stores `session_token` in `subscriber_session_{propertyHash}` localStorage

**Return visit (magic link):**
1. Resident enters email on status page
2. System creates short-lived `magic_link_tokens` record (15-min expiry)
3. Magic link email sent
4. Resident clicks link -> magic link token validated + marked used
5. `session_token` rotated (new random value replaces old), returned to client
6. Client stores new `session_token` in localStorage

**Token rotation:** Every magic link login generates a fresh `session_token`, invalidating any previous session on other devices. This limits the window of exposure if a token leaks, and provides implicit "sign out everywhere" behavior.

**Session validation:**
- Client sends `session_token` as bearer token on API requests
- Server validates by looking up subscription where `session_token` matches, `confirmed_at IS NOT NULL`, and `revoked_at IS NULL`
- No separate session table needed

**Session priority on page load:**
```
1. subscriber_session_{propertyHash} -> identified resident (notifications + approved actions)
2. resident_session_{propertyHash}   -> anonymous QR access (read-only)
3. admin_session                     -> admin/manager mode
4. none                              -> public view
```

#### QR Code to Subscriber Flow

When a resident scans a unit-specific QR code (e.g., the QR for unit 4A), the `short_links` table already stores the `unit` field. If that resident then signs up for notifications on the same page load, the subscribe widget can auto-populate the `unit` field from the QR context:

```
QR scan -> /s/abc123 -> redirect to /{propertyHash}?unit=4A&utm_campaign=qr
                                                      ^^ passed to SubscribeWidget
```

This connects the anonymous QR access path to the identified subscriber path without requiring the resident to manually type their unit number.

#### Approval and Trust Model

| State | Can receive notifications | Can submit issues |
|-------|--------------------------|-------------------|
| Signed up, unconfirmed | No | No |
| Confirmed | Yes | No |
| Confirmed + Approved | Yes | Yes |
| Revoked | No | No |

- **Confirmation** (self-service): Resident verifies email ownership. Unlocks notifications.
- **Approval** (admin action): Manager approves a confirmed subscriber. Unlocks issue submission. Uses existing `approved_at` / `approved_by` fields.
- **Revocation** (admin or self-service): Removes all access. One-click unsubscribe link in every email (CAN-SPAM).

#### Admin Notifications

The admin/manager receives alerts for subscriber lifecycle events:

- **New subscriber confirmed** -- so the manager knows someone signed up and can approve them if appropriate
- **Pending approvals count** -- shown in the admin UI (e.g., "3 subscribers pending approval") so approvals don't go stale

Implementation: These are lightweight -- the pending-approval count is a query on page load, and the new-subscriber alert can be an email to the property's configured `reportEmail` (already stored in the `config` table).

#### Email Provider

**Resend** -- modern API, generous free tier (3,000 emails/month), good deliverability.

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

Templates are inline HTML (no React Email dependency). Every email includes:
- Property name in subject and body
- One-click unsubscribe link using `confirmation_token`
- `List-Unsubscribe` and `List-Unsubscribe-Post` headers for CAN-SPAM / RFC 8058 compliance

Application gracefully handles missing `RESEND_API_KEY` (logs warning, skips send).

**Email preview/test mode:** Admin can send a test notification to their own email via:
```
POST /api/[propertyHash]/notifications/test
Authorization: Bearer <admin_session_token>
Body: { template: "new_issue", email: "manager@example.com" }
```
This renders the template with sample data and sends to the specified address, allowing the manager to verify formatting and deliverability before going live.

#### Email Deliverability Prerequisites

Before notifications can send reliably, DNS records must be configured for the sending domain:

1. **Domain verification** -- Add Resend's TXT record to prove domain ownership
2. **SPF** -- Add Resend's include to the SPF record so receiving servers trust the sender
3. **DKIM** -- Add Resend's CNAME records for cryptographic email signing
4. **DMARC** -- Add a DMARC policy (start with `p=none` for monitoring)

Resend provides these records in the dashboard after adding a domain. Without them, emails are likely to land in spam or be rejected entirely.

**Development/staging:** Use Resend's sandbox mode (`onboarding@resend.dev` as from address) which works without domain verification. Notifications will only send to the account owner's email, which is sufficient for testing.

#### Notification Triggers

| Event | Type | Channels | Timing |
|-------|------|----------|--------|
| New issue reported | `new_issue` | Email | Immediate |
| Issue resolved | `issue_resolved` | Email | Immediate |
| Maintenance scheduled | `maintenance_scheduled` | Email | Immediate |
| Maintenance reminder | `maintenance_reminder` | Email | Scheduled (uses `notify_before_minutes`) |
| System status changed | `status_change` | Email | Immediate |
| Announcement posted | `new_announcement` | Email | Immediate |

Immediate triggers are fire-and-forget: mutations enqueue to `notification_queue` without blocking the API response. Failures are logged, never propagated to the admin.

**Reminder scheduling:** The `notify_before_minutes` field on the `events` table (e.g., `[1440, 60]` = 24h and 1h before) is consumed by the queue processor's cron run. On each run, the processor also checks for upcoming events whose reminder windows have opened:

```sql
-- Find events needing reminders (pseudocode)
SELECT e.id, e.title, e.starts_at, unnest(e.notify_before_minutes) AS mins_before
FROM events e
WHERE e.status = 'scheduled'
  AND e.starts_at - (unnest(e.notify_before_minutes) || ' minutes')::interval <= NOW()
  AND NOT EXISTS (
    -- Skip if reminder already enqueued for this event + interval
    SELECT 1 FROM notification_queue nq
    WHERE nq.type = 'maintenance_reminder'
      AND nq.batch_key = 'reminder_' || e.id || '_' || unnest(e.notify_before_minutes)
  );
```

The `batch_key` prevents duplicate reminders across cron runs: each (event_id, minutes_before) combination enqueues exactly once.

#### Queue Processing

Database-backed queue processed via cron-triggered API endpoint:

```
POST /api/notifications/process
Authorization: Bearer <NOTIFICATION_QUEUE_API_KEY>
```

The processor handles two jobs per run:

1. **Enqueue reminders** -- Check for upcoming events whose `notify_before_minutes` windows have opened. Enqueue one notification per active subscriber per reminder interval.
2. **Send pending notifications** -- Process up to 50 pending items from `notification_queue`.

Processing rules:
- 5-minute backoff between retry attempts on the same notification
- Max 3 attempts before marking as `failed`
- Triggered by external cron every 2 minutes
- Skips notifications for revoked subscribers (marks as sent to clear queue)

#### Queue Observability

Failed and stale notifications should not pile up silently.

**Admin API endpoint:**
```
GET /api/[propertyHash]/notifications/queue-stats
Authorization: Bearer <admin_session_token>
Response: { pending: 12, failed: 2, sentLast24h: 45, oldestPending: "2026-02-11T..." }
```

**Admin UI indicator:** The `AdminSubscriberList` component shows:
- Count of pending notifications (warning if > 0 for more than 10 minutes)
- Count of failed notifications (error state, with "retry failed" action)
- Count of subscribers pending approval (badge on the subscriber management section)

**Alerting (lightweight):** If the queue processor finds > 100 pending notifications or > 10 failed, it logs an error-level message. External monitoring (Sentry, Render logs) can pick this up. No separate alerting infrastructure needed at current scale.

#### Resident Issue Submission

Approved subscribers can submit issues via a separate endpoint from admin issue creation:

```
POST /api/[propertyHash]/issues/report
Authorization: Bearer <session_token>
```

- Validates subscriber is confirmed AND approved
- Creates issue with `created_by` set to subscriber email
- Simplified form: category, location, detail (no status/icon selection)
- 403 if subscriber not approved

#### API Endpoints

**Public (no auth):**
```
POST /api/[propertyHash]/notifications/subscribe     -- signup with email + unit
GET  /api/[propertyHash]/notifications/confirm        -- email verification (redirects)
POST /api/[propertyHash]/notifications/login          -- request magic link
GET  /api/[propertyHash]/notifications/auth           -- magic link landing (redirects)
GET  /api/[propertyHash]/notifications/unsubscribe    -- one-click unsubscribe (redirects)
```

**Subscriber auth (session_token as bearer):**
```
GET  /api/[propertyHash]/notifications/preferences    -- get current preferences
PUT  /api/[propertyHash]/notifications/preferences    -- update preferences
POST /api/[propertyHash]/issues/report                -- submit issue (approved only)
```

**Admin auth (admin session token as bearer):**
```
GET    /api/[propertyHash]/notifications/subscribers              -- list all subscribers
POST   /api/[propertyHash]/notifications/subscribers              -- board-invite a subscriber
POST   /api/[propertyHash]/notifications/subscribers/[id]/approve -- approve for issue submission
DELETE /api/[propertyHash]/notifications/subscribers/[id]         -- revoke subscriber
GET    /api/[propertyHash]/notifications/queue-stats              -- queue health
POST   /api/[propertyHash]/notifications/test                     -- send test email to admin
```

**Internal (API key):**
```
POST /api/notifications/process    -- cron-triggered queue processor + reminder scheduler
```

---

### Part 3: SMS Notifications (Future)

Integrate Twilio for critical alerts (outages, emergencies). SMS is expensive (~$0.0079/message) -- reserve for explicit opt-in only with rate limiting (max 2 SMS/day per subscriber).

### Part 4: Web Push (Future)

Requires service worker (PWA). Use `web-push` library with VAPID keys. Best for real-time alerts without email delay.

### Part 5: Native App Push (Future)

APNs (iOS) and FCM (Android) when native apps are built.

---

## Libraries

| Purpose | Library | Status |
|---------|---------|--------|
| iCal generation | `ical-generator` | Deployed |
| RRULE parsing | `rrule` | Deployed |
| Email | `resend` | Phase 2 |

---

## Implementation Phases

### Phase 1: Calendar Events -- Complete
- [x] `events` table with timestamps, recurrence, timezone support
- [x] RRULE recurrence (monthly exterminator, quarterly inspections)
- [x] Event CRUD forms and components
- [x] `/api/[propertyHash]/calendar.ics` iCal feed endpoint
- [x] CalendarSubscribe UI with Apple/Google/download links

### Phase 2: Resident Identity + Email Notifications -- In Progress

**Prerequisites:**
- [ ] Resend account created, sending domain added
- [ ] DNS records configured: SPF, DKIM, DMARC, domain verification TXT
- [ ] DNS propagation verified (can take 24-48h)
- [ ] Environment variables set: `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`, `NOTIFICATION_QUEUE_API_KEY`

**Implementation:**
1. Schema migration: add `unit` + `session_token` columns, `batch_key` on queue, create `magic_link_tokens` table, add partial unique index
2. Email service with Resend integration and inline HTML templates
3. Notification query functions, magic link auth, token rotation
4. Public API routes: subscribe, confirm, login, auth, unsubscribe, preferences
5. Admin API routes: list subscribers, board-invite, approve, revoke, queue-stats, test email
6. Notification triggers hooked into existing mutation routes
7. Queue processor endpoint with cron trigger + reminder scheduling
8. Resident issue submission (approved subscribers only)
9. Admin notifications: new-subscriber email to manager, pending-approval count in UI
10. UI: SubscribeWidget (with QR unit auto-populate), NotificationPreferences, ResidentIssueForm, AdminSubscriberList (with queue health indicators)

### Phase 3: SMS Notifications (Future)
1. Integrate Twilio
2. Add phone verification
3. SMS for critical alerts only

### Phase 4: Web Push (Future)
1. Service worker + PWA
2. Push subscription management
3. Push notifications for real-time alerts

---

## Security Considerations

1. **Token separation**: `confirmation_token` (in emails, for unsubscribe only) is separate from `session_token` (in localStorage, for API auth). A forwarded email cannot leak session access.
2. **Token rotation**: `session_token` is regenerated on every magic link login. Previous sessions on other devices are implicitly invalidated.
3. **Rate limiting**: Subscribe and login endpoints use an in-memory rate limiter keyed on IP address + email address:
   - Subscribe: max 3 requests per email per hour; max 10 requests per IP per hour
   - Login (magic link request): max 5 requests per email per hour; max 20 per IP per hour
   - Requests exceeding limits receive 429 Too Many Requests
   - In-memory `Map<string, { count: number, resetAt: number }>` is sufficient at current scale (<100 residents). Resets on deploy, which is acceptable.
4. **Dedup constraint**: Partial unique index on `(property_id, contact_value) WHERE revoked_at IS NULL` prevents duplicate active subscriptions at the database level, guarding against race conditions.
5. **Email verification**: Required before any notifications are sent
6. **CAN-SPAM compliance**: One-click unsubscribe in every email via `confirmation_token`, `List-Unsubscribe` and `List-Unsubscribe-Post` headers (RFC 8058)
7. **Magic link security**: Tokens are 64-char hex from `crypto.randomBytes(32)`, expire after 15 minutes, single-use (marked `used_at` on click), previous unused tokens for the same subscription are invalidated on new request
8. **Session priority**: Subscriber session supersedes anonymous QR session but does not grant admin access
9. **Property isolation**: All queries scoped by `propertyId` -- subscribers cannot access other properties
10. **Approval gating**: Issue submission hidden until admin explicitly approves subscriber

---

## Data Privacy and Retention

This system stores personally identifiable information (email addresses) mapped to physical locations (property + unit). Even where GDPR does not legally apply, we adopt its principles:

**What is stored:**
- Email address, property association, optional unit number
- Notification preferences (booleans)
- Notification delivery log (subject, status, timestamps -- not full message bodies after 90 days)

**Retention policy:**
- **Unconfirmed subscriptions**: Auto-deleted after 7 days (cron cleanup)
- **Revoked subscriptions**: PII (email, unit) scrubbed after 30 days, retaining only an anonymized record for analytics (subscriber count history)
- **Notification queue**: Sent/failed entries older than 90 days are pruned, retaining only aggregate counts
- **Magic link tokens**: Expired tokens deleted on each cron run (no retention)

**Resident rights:**
- **Access**: Subscribers can view all stored data about them via the preferences page
- **Deletion**: Unsubscribe revokes access; PII is scrubbed per retention policy above. Immediate deletion available on request to admin.
- **Portability**: Not applicable at current scale

**Admin responsibility:**
- Admin can revoke any subscriber, triggering the retention/scrub pipeline
- No subscriber data is shared with third parties (Resend receives email addresses for delivery only, per their DPA)

---

## Cost Estimates

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|----------------------|
| Resend | 3,000 emails/month | $0 (sufficient for <100 residents) |
| Twilio SMS (future) | None | ~$5-10 |
| Web Push (future) | Free | $0 |

---

## Resolved Questions

1. **Recurring events**: Implemented in Phase 1 with RRULE support
2. **Digest mode**: Deferred -- `batch_key` column added to `notification_queue` to enable future batching without migration
3. **Notification batching**: Deferred -- send per-event initially. `batch_key` provides the hook for grouping later
4. **Building-specific subscriptions**: Handled via existing `propertyId` scoping on every table. Each subscription is tied to one property. Residents in multiple buildings create separate subscriptions.
5. **Password vs passwordless**: Magic link chosen. Avoids password management complexity for a residential app where usage is infrequent.
6. **Subscriber vs separate user table**: Subscription record IS the identity. Avoids schema sprawl for current needs. Can extract a `residents` table later if capabilities grow beyond notifications + issue submission.
7. **Session storage**: Separate `session_token` (rotated, for API auth) and `confirmation_token` (permanent, for email unsubscribe). Client stores `session_token` in localStorage.
8. **Approval scope**: Approval unlocks issue submission only. Notifications require only email confirmation.
9. **Token leakage risk**: Mitigated by separating session tokens from email-visible tokens. Forwarded emails expose only unsubscribe capability (low-severity, reversible).
10. **Reminder notifications**: `notify_before_minutes` on events is consumed by the cron processor, which checks for upcoming events and enqueues reminders using `batch_key` to prevent duplicates.
11. **QR-to-subscriber flow**: Unit-specific QR codes pass `unit` via query param, which the SubscribeWidget auto-populates. Connects the anonymous QR funnel to identified subscriber creation.
12. **Admin awareness**: Manager receives email on new subscriber confirmation. Pending-approval count shown in admin UI.
13. **Data privacy**: PII scrubbed from revoked subscriptions after 30 days. Unconfirmed subscriptions auto-deleted after 7 days. Notification history pruned after 90 days.

---

## References

- [RFC 5545 - iCalendar](https://datatracker.ietf.org/doc/html/rfc5545)
- [RFC 8058 - One-Click Unsubscribe](https://datatracker.ietf.org/doc/html/rfc8058)
- [ical-generator docs](https://github.com/sebbo2002/ical-generator)
- [Resend docs](https://resend.com/docs)
- [CAN-SPAM Act](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
