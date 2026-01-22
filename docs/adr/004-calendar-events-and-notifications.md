# ADR 004: Calendar Events and Subscriber Notifications

## Status
**Proposed** - Draft for review

## Context

The current system has limitations:
- **Maintenance dates** are stored as freeform strings ("Thu, Jan 8") with no machine-readable timestamps
- **No subscriber system** - residents must manually check the status page
- **No calendar integration** - can't sync maintenance schedules to personal calendars

Residents have requested:
1. Calendar feed (iCal/webcal) for maintenance schedules
2. Notifications when issues are reported or resolved
3. Reminders before scheduled maintenance

## Decision

### Part 1: Calendar Events Schema

Transform maintenance and announcements into proper calendar events with timestamps.

#### New `events` Table

Replaces the current `maintenance` table with a more flexible event model:

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,

  -- Event type and display
  type VARCHAR(20) NOT NULL,        -- 'maintenance', 'announcement', 'outage'
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- Timing (all timestamps in UTC)
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,                -- NULL = point-in-time event
  all_day BOOLEAN DEFAULT false,
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Recurrence (future - store RRULE string)
  recurrence_rule TEXT,             -- RFC 5545 RRULE format

  -- Status tracking
  status VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  completed_at TIMESTAMP,

  -- Notification settings
  notify_before_minutes INTEGER[],  -- e.g., [1440, 60] = 24hr and 1hr before

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Index for efficient calendar queries
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_type_status ON events(type, status);
```

#### Migration Path

Since existing `maintenance` data is dev samples only:
1. Create new `events` table
2. Drop `maintenance` table
3. Update all queries and components to use `events`
4. Seed with sample recurring events (exterminator, etc.)

#### TypeScript Types

```typescript
interface CalendarEvent {
  id: number;
  type: 'maintenance' | 'announcement' | 'outage';
  title: string;
  description: string | null;

  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  timezone: string;

  recurrenceRule: string | null;

  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completedAt: Date | null;

  notifyBeforeMinutes: number[];

  createdAt: Date;
  updatedAt: Date;
}
```

---

### Part 2: iCal Feed

Expose a public calendar feed that residents can subscribe to.

#### Endpoint

```
GET /api/calendar.ics
GET /api/calendar.ics?type=maintenance
GET /api/calendar.ics?type=all
```

#### Implementation

Use the `ical-generator` library (stable, well-maintained):

```typescript
import ical, { ICalCalendar, ICalEventStatus } from 'ical-generator';

export async function generateCalendarFeed(types?: string[]): Promise<string> {
  const calendar = ical({
    name: 'Building Status - 712 W Cornelia',
    timezone: 'America/New_York',
    prodId: { company: 'Building Status', product: 'Calendar' },
    url: process.env.NEXT_PUBLIC_SITE_URL,
  });

  const events = await getUpcomingEvents(types);

  for (const event of events) {
    calendar.createEvent({
      id: `event-${event.id}@building-status`,
      start: event.startsAt,
      end: event.endsAt || event.startsAt,
      allDay: event.allDay,
      summary: event.title,
      description: event.description,
      status: mapStatus(event.status),
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/#event-${event.id}`,
    });
  }

  return calendar.toString();
}
```

#### Response Headers

```
Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="building-status.ics"
Cache-Control: public, max-age=3600
```

#### Subscribe Links

Display on status page:
- **Apple Calendar**: `webcal://building-status.example.com/api/calendar.ics`
- **Google Calendar**: `https://calendar.google.com/calendar/r?cid=webcal://...`
- **Download .ics**: Direct link to `/api/calendar.ics`

---

### Part 3: Subscriber System

Allow residents to opt-in to notifications.

#### `subscribers` Table

```sql
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,

  -- Contact info (at least one required)
  email VARCHAR(255),
  phone VARCHAR(20),               -- E.164 format: +1234567890

  -- Verification
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(100),
  verification_expires_at TIMESTAMP,

  -- Preferences (JSONB for flexibility)
  preferences JSONB DEFAULT '{
    "channels": {
      "email": true,
      "sms": false,
      "push": false
    },
    "types": {
      "issues": true,
      "maintenance": true,
      "announcements": true
    },
    "quietHours": {
      "enabled": false,
      "start": "22:00",
      "end": "08:00"
    }
  }',

  -- Push notification tokens (for future PWA/app)
  push_subscriptions JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP         -- Soft delete
);

CREATE UNIQUE INDEX idx_subscribers_email ON subscribers(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_subscribers_phone ON subscribers(phone) WHERE phone IS NOT NULL;
```

#### `notifications` Table (Outbound Log)

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,

  subscriber_id INTEGER REFERENCES subscribers(id),
  event_id INTEGER REFERENCES events(id),

  -- Delivery details
  channel VARCHAR(20) NOT NULL,    -- 'email', 'sms', 'push'
  template VARCHAR(50) NOT NULL,   -- 'issue_reported', 'maintenance_reminder', etc.

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'sent', 'delivered', 'failed', 'bounced'

  -- External IDs for tracking
  external_id VARCHAR(100),        -- Sendgrid/Twilio message ID

  -- Timestamps
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_subscriber ON notifications(subscriber_id);
CREATE INDEX idx_notifications_status ON notifications(status, scheduled_for);
```

---

### Part 4: Notification Channels

#### Email (Primary)

**Provider**: Resend (modern, developer-friendly, generous free tier)
**Alternative**: SendGrid, Postmark

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to: string, template: string, data: object) {
  return resend.emails.send({
    from: 'Building Status <notifications@building-status.example.com>',
    to,
    subject: getSubject(template, data),
    html: renderTemplate(template, data),
  });
}
```

#### SMS

**Provider**: Twilio (industry standard)

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to: string, message: string) {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}
```

**Cost consideration**: SMS is expensive (~$0.0079/message). Reserve for:
- Critical alerts (outages, emergencies)
- Explicit opt-in only
- Rate limit: max 2 SMS/day per subscriber

#### Web Push (Future)

**Library**: `web-push` (Node.js)

Requires:
- Service worker (already planned for PWA)
- VAPID keys
- User permission prompt

#### Native App Push (Future)

When apps are built:
- iOS: Apple Push Notification Service (APNs)
- Android: Firebase Cloud Messaging (FCM)

Store device tokens in `subscribers.push_subscriptions` JSONB array.

---

### Part 5: Notification Triggers

| Event | Template | Channels | Timing |
|-------|----------|----------|--------|
| New issue reported | `issue_reported` | Email | Immediate |
| Issue status changed | `issue_updated` | Email | Immediate |
| Issue resolved | `issue_resolved` | Email | Immediate |
| Maintenance scheduled | `maintenance_scheduled` | Email | Immediate |
| Maintenance reminder | `maintenance_reminder` | Email, SMS (opt-in) | 24h and 1h before |
| Maintenance started | `maintenance_started` | Email | Immediate |
| Maintenance completed | `maintenance_completed` | Email | Immediate |
| System outage | `system_outage` | Email, SMS, Push | Immediate |
| Announcement posted | `announcement_new` | Email | Immediate |

#### Notification Queue

Use a simple database-backed queue for reliability:

```typescript
// Enqueue notification
async function enqueueNotification(
  subscriberId: number,
  eventId: number,
  template: string,
  channel: string,
  scheduledFor?: Date
) {
  await db.insert(notifications).values({
    subscriberId,
    eventId,
    template,
    channel,
    scheduledFor: scheduledFor || new Date(),
    status: 'pending',
  });
}

// Process queue (run via cron or Render background worker)
async function processNotificationQueue() {
  const pending = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.status, 'pending'),
        lte(notifications.scheduledFor, new Date())
      )
    )
    .limit(50);

  for (const notification of pending) {
    await sendNotification(notification);
  }
}
```

---

### Part 6: Subscription Flow

#### UI: Subscribe Widget

Add to status page footer:

```
┌─────────────────────────────────────┐
│  🔔 Get notified about updates     │
│                                     │
│  Email: [________________] [Submit] │
│                                     │
│  Or subscribe to our calendar:      │
│  📅 Add to Calendar ▾              │
└─────────────────────────────────────┘
```

#### API Endpoints

```
POST /api/subscribe
  Body: { email?, phone?, preferences? }
  Response: { success, message, verificationRequired }

GET /api/subscribe/verify?token=xxx
  Verifies email/phone

POST /api/unsubscribe
  Body: { email } or use token from email footer

GET /api/subscribe/preferences?token=xxx
  Returns current preferences

PUT /api/subscribe/preferences
  Body: { token, preferences }
```

---

## Libraries

| Purpose | Library | Notes |
|---------|---------|-------|
| iCal generation | `ical-generator` | 4.5k stars, actively maintained |
| iCal parsing (if needed) | `ical.js` | For importing events |
| Email | `resend` | Modern API, React Email support |
| SMS | `twilio` | Industry standard |
| Web Push | `web-push` | For PWA notifications |
| Date handling | `date-fns` or `luxon` | Timezone-aware operations |
| RRULE parsing | `rrule` | RFC 5545 recurrence rules |

---

## Implementation Phases

### Phase 1: Calendar Events (Foundation)
1. Create `events` table (drop existing `maintenance` - dev data only)
2. Implement RRULE recurrence support (monthly exterminator, etc.)
3. Update forms and components to use new schema with date/time pickers
4. Implement `/api/calendar.ics` endpoint
5. Add "Subscribe to Calendar" UI

### Phase 2: Email Notifications
1. Create `subscribers` and `notifications` tables
2. Implement subscribe/verify flow
3. Set up Resend integration
4. Send notifications on issue/maintenance changes

### Phase 3: SMS Notifications
1. Integrate Twilio
2. Add phone verification
3. Implement SMS for critical alerts only

### Phase 4: Web Push (with PWA)
1. Set up service worker
2. Implement push subscription
3. Send push notifications

### Phase 5: Native App Push (Future)
1. Build iOS/Android apps
2. Integrate APNs/FCM
3. Universal notification preferences

---

## Security Considerations

1. **Rate limiting**: Prevent abuse of subscribe endpoint
2. **Verification**: Require email/phone verification before sending
3. **Unsubscribe**: One-click unsubscribe in every message (CAN-SPAM compliance)
4. **Token security**: Use cryptographically random verification tokens
5. **Quiet hours**: Respect subscriber preferences
6. **Data retention**: Auto-delete unverified subscriptions after 7 days

---

## Cost Estimates

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|----------------------|
| Resend | 3,000 emails/month | $0 (free tier sufficient) |
| Twilio SMS | None | ~$5-10 (100-200 SMS) |
| Web Push | Free | $0 |

---

## Resolved Questions

1. **Recurring events**: Yes, include in Phase 1. Use cases: monthly exterminator, quarterly inspections
2. **Digest mode**: Deferred - not in initial scope
3. **Notification batching**: Phase 2 - send individual notifications initially
4. **Migration**: No migration needed - existing maintenance data is dev samples only

## Open Questions

1. **Building-specific subscriptions**: If multi-building support is added, how do preferences work?

---

## References

- [RFC 5545 - iCalendar](https://datatracker.ietf.org/doc/html/rfc5545)
- [ical-generator docs](https://github.com/sebbo2002/ical-generator)
- [Resend docs](https://resend.com/docs)
- [Twilio Node.js](https://www.twilio.com/docs/sms/quickstart/node)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
