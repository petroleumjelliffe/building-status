# Building Status Page - Product Spec (Prototype)

## Overview

A lightweight status page for self-managed co-ops. No apps to install, no accounts to create. Update via text, subscribe via text, or just check the web page.

## Target User

**Building type:** Self-managed co-ops, 10-60 units
**Board members:** Volunteers, not tech professionals, already overwhelmed
**Residents:** Won't install another app, already on WhatsApp/Signal, just want to know when the elevator will be fixed

## Design Principles

1. **Meet people where they are** - Works over existing channels (SMS, WhatsApp, email, web)
2. **No friction for residents** - No accounts, no passwords, no app installs
3. **Minimal admin for board** - Update status as easily as sending a text
4. **Transparency by default** - Public status page with incident history
5. **Structured enough to be useful** - Not just a chat log, actual system states and timelines

## Core Concepts

### Entities

**Building**
- Name, address
- Timezone
- Contact info (super, management)

**System** (the things that can be up or down)
- Name (Elevator, Hot Water, Boiler/Heat, Laundry Room, Intercom, etc.)
- Current status: `operational` | `degraded` | `outage` | `maintenance`
- Last updated timestamp

**Incident**
- Linked to one or more systems
- Title (e.g., "Elevator out of service")
- Severity: `minor` | `major` | `critical`
- Status: `investigating` | `identified` | `scheduled` | `in_progress` | `resolved`
- Updates (timestamped log of progress)
- Estimated resolution (optional)
- Created/resolved timestamps

**Scheduled Event**
- Type: `maintenance` | `meeting` | `inspection` | `social`
- Title, description
- Start/end datetime
- Linked systems (if maintenance)
- Status: `scheduled` | `in_progress` | `completed` | `cancelled`

**Subscriber**
- Phone number or email
- Notification preferences (all, maintenance only, emergencies only)
- Channel preference (SMS, email)

## User Interfaces

### 1. Public Status Page (Web)

URL: `status.lindenheights.coop` or `buildingstatus.app/linden-heights`

**Content:**
- Building name and current overall status
- List of systems with current status indicators
- Active incidents with latest update
- Upcoming scheduled maintenance/events
- Recent incident history (last 30 days)
- Subscribe link/QR code
- Calendar feed link/QR code

**Design:**
- Mobile-first, fast-loading
- No login required
- Printable view for lobby posting
- QR code generation for physical distribution

### 2. SMS/Text Interface

**For residents (query):**
```
Text "STATUS" to (555) 123-4567
→ "Linden Heights Status: All systems operational. Upcoming: Boiler inspection Thu 1/18 9am-12pm. View: status.lindenheights.coop"

Text "ELEVATOR" to (555) 123-4567  
→ "Elevator: OUTAGE since Jan 15 2pm. Vendor scheduled Jan 16 morning. Updates: status.lindenheights.coop/incidents/123"

Text "SUBSCRIBE" to (555) 123-4567
→ "You're subscribed to Linden Heights alerts. Reply STOP to unsubscribe, PREFS to change settings."
```

**For board members (update):**
```
Text "ELEVATOR OUT waiting for vendor"
→ "Created incident: Elevator outage. Status page updated. 38 subscribers notified."

Text "ELEVATOR UPDATE vendor on site, eta 2 hours"
→ "Incident updated. 38 subscribers notified."

Text "ELEVATOR RESOLVED"
→ "Incident resolved. Duration: 6 hours. 38 subscribers notified."
```

Board members authenticated by phone number (allowlist).

### 3. Calendar Feed (iCal/ICS)

URL: `status.lindenheights.coop/calendar.ics`

**Includes:**
- Scheduled maintenance windows
- Board meetings
- Inspections (fire, boiler, etc.)
- Social events (if added)

Subscribable from Google Calendar, Apple Calendar, Outlook.

### 4. Admin Interface (Web, Simple)

For board members to:
- Add/edit systems
- Create scheduled events
- View subscriber list
- View incident history and analytics
- Manage board member phone allowlist
- Generate QR codes and printable status sheets

Minimal UI, could be a simple dashboard or even Notion-like.

## Notification Logic

**When incident created:**
- Update status page immediately
- Notify all subscribers (or severity-filtered)
- Post to WhatsApp group (webhook integration)

**When incident updated:**
- Update status page
- Notify subscribers who opted into updates
- Post to WhatsApp group

**When incident resolved:**
- Update status page
- Notify all subscribers
- Post resolution summary to WhatsApp group

**Scheduled event reminders:**
- 24 hours before (email)
- Morning of (SMS)
- Configurable per event type

## Data Model (Draft)

```typescript
interface Building {
  id: string;
  name: string;
  slug: string; // for URL
  timezone: string;
  contactInfo: {
    super?: { name: string; phone: string };
    management?: { name: string; phone: string; email: string };
    emergency?: string;
  };
}

interface System {
  id: string;
  buildingId: string;
  name: string;
  slug: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  statusUpdatedAt: Date;
  sortOrder: number;
}

interface Incident {
  id: string;
  buildingId: string;
  systemIds: string[];
  title: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'scheduled' | 'in_progress' | 'resolved';
  updates: IncidentUpdate[];
  estimatedResolution?: Date;
  createdAt: Date;
  resolvedAt?: Date;
}

interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  status: Incident['status'];
  createdAt: Date;
  createdBy: string; // board member phone or "system"
}

interface ScheduledEvent {
  id: string;
  buildingId: string;
  type: 'maintenance' | 'meeting' | 'inspection' | 'social';
  title: string;
  description?: string;
  systemIds?: string[]; // if maintenance
  startsAt: Date;
  endsAt?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface Subscriber {
  id: string;
  buildingId: string;
  channel: 'sms' | 'email';
  destination: string; // phone or email
  preferences: {
    emergencies: boolean;
    maintenance: boolean;
    meetings: boolean;
    social: boolean;
  };
  subscribedAt: Date;
}

interface BoardMember {
  id: string;
  buildingId: string;
  name: string;
  phone: string; // for SMS auth
  role?: string;
}
```

## Tech Stack (Prototype)

**Web:**
- Static site or simple React app
- Hosted on Vercel/Netlify/Cloudflare Pages

**Backend:**
- Node.js or Go
- SQLite (simple) or Postgres (if multi-tenant from start)
- Hosted on Fly.io, Railway, or Render

**SMS:**
- Twilio for inbound/outbound SMS
- Simple webhook handler for parsing commands

**Calendar:**
- Generate ICS dynamically from events table

**WhatsApp (later):**
- Twilio WhatsApp API or WhatsApp Business API
- More complex, save for v2

## Prototype Scope (v0.1 - Dogfood)

**Build:**
- [ ] Public status page (web)
- [ ] Systems list with manual status
- [ ] Incident creation and updates (web admin)
- [ ] Incident history display
- [ ] SMS inbound: STATUS, [SYSTEM], SUBSCRIBE, STOP
- [ ] SMS outbound: notifications on incident create/update/resolve
- [ ] Subscriber management (basic)
- [ ] Calendar feed (ICS) for scheduled events
- [ ] QR code generation for lobby posting

**Skip for now:**
- [ ] SMS-based incident updates from board (v0.2)
- [ ] WhatsApp integration (v0.2)
- [ ] Scheduled event reminders (v0.2)
- [ ] Multi-building support (v0.3)
- [ ] Analytics dashboard (v0.3)
- [ ] IoT device ingestion (future)

## Success Metrics (Dogfood Phase)

- Board members actually use it to post updates
- Residents check the page or subscribe
- Reduction in "is the elevator fixed yet?" messages in WhatsApp group
- Board finds it less effort than current approach

## Open Questions

1. **Domain/URL strategy:** Subdomain of a service (buildingstatus.app/linden-heights) or custom domain per building?
2. **Auth for admin:** Simple magic link? Phone verification? Just trust the allowlist?
3. **WhatsApp bot vs. group webhook:** Bot is more interactive but harder to set up. Webhook to existing group is simpler but one-way.
4. **Pricing model (later):** Per building flat fee? Per unit? Free tier with limits?

## Competitive Position

**Why not existing solutions:**

| Solution | Cost | Problem for self-managed co-ops |
|----------|------|--------------------------------|
| BuildingLink | ~$200-500/mo | Overkill, designed for doorman buildings |
| Condo Control, TownSq | Similar | Enterprise focus, requires resident adoption |
| WhatsApp group alone | Free | No structure, things get lost |
| Email threads | Free | Reply-all chaos, no status history |

**Our angle:**

- **5x simpler** - No app to install, works over existing channels
- **5x more transparent** - Status page model, not ticket system
- **5x less admin** - No resident onboarding, no accounts to manage

**Value prop:**

> "A building status page for self-managed co-ops. No apps to install, no accounts to create. Update via text, subscribe via text, or just check the web page."

---

## Current Implementation - Web Admin UI (v0.1)

### Authentication & Edit Mode UX Redesign

**Current behavior (to be replaced):**
- "Edit" link in header, visible to everyone
- Click opens password modal
- On successful login, edit mode immediately active
- Session not persisted (re-login every page refresh)
- All editing controls (tap-to-cycle, edit buttons) immediately available

**New behavior (planned):**

#### 1. Hamburger Menu (Login/Logout) & Edit Toggle

**Visual Design:**
```
Not logged in:
┌─────────────────────────────────────┐
│ Building Status           📤 ☰      │ ← No edit button, just share and hamburger
└─────────────────────────────────────┘

Hamburger menu (not logged in):
┌─────────────────────────────────────┐
│                              ✕      │
│                                     │
│        [Login]                      │
│                                     │
└─────────────────────────────────────┘

Logged in, edit mode OFF:
┌─────────────────────────────────────┐
│ Building Status  [Edit OFF] 📤 ☰   │ ← Yellow edit toggle appears when logged in
└─────────────────────────────────────┘

Logged in, edit mode ON:
┌─────────────────────────────────────┐
│ Building Status  [Edit ON] 📤 ☰    │ ← Yellow toggle active
└─────────────────────────────────────┘

Hamburger menu (logged in):
┌─────────────────────────────────────┐
│                              ✕      │
│                                     │
│        👤 Logged in                 │
│                                     │
│        [Logout]                     │
│                                     │
└─────────────────────────────────────┘
```

**Component Structure:**
- `HamburgerMenu.tsx` - Menu overlay with Login button (not logged in) or Logout button (logged in)
- `EditToggle.tsx` - Yellow toggle button (only visible when logged in)
- `LoginModal.tsx` - Password input modal (triggered by Login button in hamburger)

**Interaction:**
1. **Not logged in:**
   - No edit toggle visible
   - Tap ☰ → Menu opens showing [Login] button
   - Tap [Login] → Password modal opens
   - Enter password → On success, modal closes, menu closes
   - Edit toggle [Edit OFF] appears in header

2. **Logged in, edit mode OFF:**
   - [Edit OFF] yellow toggle visible in header
   - Tap toggle → Changes to [Edit ON], controls activate
   - All editing controls now work (tap-to-cycle, edit buttons)

3. **Logged in, edit mode ON:**
   - [Edit ON] yellow toggle visible in header (highlighted)
   - Tap toggle → Changes to [Edit OFF], controls deactivate
   - Page looks like public view again

4. **Logout:**
   - Tap ☰ → Menu opens showing "Logged in" status and [Logout] button
   - Tap [Logout] → Session cleared
   - Edit toggle disappears from header
   - Hamburger menu now shows [Login] button again

#### 2. Session Persistence

**Technical Approach:**
- Use browser `localStorage` to store auth session token
- Generate JWT or session ID on successful password verification
- Store session with expiration (e.g., 7 days)
- Validate session on page load via API endpoint

**Implementation:**
```typescript
// lib/session.ts
interface Session {
  token: string;
  expiresAt: number; // Unix timestamp
}

export function saveSession(token: string, expiresInDays: number = 7) {
  const session: Session = {
    token,
    expiresAt: Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)
  };
  localStorage.setItem('admin_session', JSON.stringify(session));
}

export function getSession(): Session | null {
  const stored = localStorage.getItem('admin_session');
  if (!stored) return null;

  const session: Session = JSON.parse(stored);
  if (Date.now() > session.expiresAt) {
    clearSession();
    return null;
  }

  return session;
}

export function clearSession() {
  localStorage.removeItem('admin_session');
}
```

**API Changes:**
- `POST /api/auth/login` - Takes password, returns session token
- `GET /api/auth/verify` - Takes token, returns validity
- `POST /api/auth/logout` - Invalidates token (optional, can just clear client-side)

**Session Token Generation:**
```typescript
// lib/auth.ts
import crypto from 'crypto';

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store in database or in-memory (for prototype, env variable allowlist works)
const activeSessions = new Set<string>();

export function validateSessionToken(token: string): boolean {
  return activeSessions.has(token);
}

export function createSession(password: string): string | null {
  if (!verifyPassword(password)) return null;

  const token = generateSessionToken();
  activeSessions.add(token);

  // Optional: Store in Redis or DB with expiration
  // For prototype, in-memory is fine (resets on server restart)

  return token;
}
```

#### 3. Edit Mode Toggle

**Behavior:**
- Only visible when logged in
- Defaults to OFF on page load (even if logged in)
- Must explicitly enable to use editing controls
- Persists across page navigation within session (sessionStorage)
- Resets to OFF when browser tab closed

**Visual Design:**
```
Edit Mode: [ ○────── ] OFF   ← Tap to enable
Edit Mode: [ ──────● ] ON    ← Tap to disable

When ON:
- Status pills show "tap to cycle" cursor
- Issue/Maintenance cards show ✏️ and ✓ buttons
- Visual indicator on page (e.g., orange border or badge)

When OFF:
- All editing controls hidden
- Page looks like public view
```

**State Management:**
```typescript
// In StatusPageClient.tsx or context
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [editMode, setEditMode] = useState(false);
const [sessionToken, setSessionToken] = useState<string | null>(null);

useEffect(() => {
  // On page load, check for stored session
  const session = getSession();
  if (session) {
    // Verify token with server
    fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${session.token}` }
    }).then(res => {
      if (res.ok) {
        setIsLoggedIn(true);
        setSessionToken(session.token);
      } else {
        clearSession();
      }
    });
  }

  // Edit mode defaults to OFF, even if logged in
  setEditMode(false);
}, []);

const toggleEditMode = () => {
  setEditMode(prev => !prev);
  // Optionally persist in sessionStorage
  sessionStorage.setItem('edit_mode', (!editMode).toString());
};
```

#### 4. Conditional Editing Controls

**Component Changes:**

**StatusPill.tsx:**
```typescript
export function StatusPill({
  systemId,
  status,
  count,
  icon,
  label,
  editable,  // ← Now means "logged in AND edit mode ON"
  sessionToken,
  onUpdate
}: StatusPillProps) {
  const handleClick = async (e: React.MouseEvent) => {
    if (!editable || !sessionToken) return; // ← Check both conditions

    // ... rest of cycling logic
  };

  return (
    <div
      className={`status-pill ${status} ${editable ? 'editable' : ''}`}
      onClick={handleClick}
      style={{ cursor: editable ? 'pointer' : 'default' }}
    >
      {/* ... */}
    </div>
  );
}
```

**IssueCard.tsx:**
```typescript
export function IssueCard({ issue, editable, sessionToken, onUpdate }: IssueCardProps) {
  const isResolved = issue.resolvedAt !== null;

  // Only show edit buttons if editable (logged in + edit mode ON) and not resolved
  const showEditButtons = editable && sessionToken && !isResolved;

  return (
    <div className={`issue-item ${isResolved ? 'resolved' : ''}`}>
      {/* ... content ... */}

      {showEditButtons && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-icon" onClick={...}>✏️</button>
          <button className="btn-icon" onClick={...}>✓</button>
        </div>
      )}
    </div>
  );
}
```

**MaintenanceCard.tsx:**
```typescript
// Same pattern - only show edit buttons if editable && sessionToken
```

#### 5. Visual Indicators for Edit Mode

**Page-level indicator when edit mode ON:**

**Option A - Border:**
```css
.page-container.edit-mode {
  border: 3px solid var(--orange);
  position: relative;
}

.page-container.edit-mode::before {
  content: "✏️ Edit Mode Active";
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: var(--orange);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  z-index: 1000;
}
```

**Option B - Badge:**
```
┌─────────────────────────────────────┐
│ Building Status         [✏️ EDIT] ☰ │ ← Badge next to hamburger
└─────────────────────────────────────┘
```

**Option C - Top banner:**
```
┌─────────────────────────────────────┐
│ ✏️ Edit Mode Active  [Turn Off] ✕  │ ← Dismissible banner
├─────────────────────────────────────┤
│ Building Status                  ☰  │
└─────────────────────────────────────┘
```

**Recommendation: Option A** (border + floating badge) - least intrusive but clear

#### 6. Updated Component Hierarchy

```
StatusPageClient.tsx
├── Header
│   ├── EditToggle (new - only visible when logged in, shows Edit OFF/Edit ON)
│   ├── ShareButton
│   └── HamburgerMenu (new - always visible, shows Login or Logout)
├── LoginModal (new - password input, shown when Login button in hamburger clicked)
├── AnnouncementBanner
├── SystemsStatus
│   └── StatusPill (editable only if logged in + edit mode ON)
├── IssuesSection
│   ├── IssueCard (edit buttons only if logged in + edit mode ON)
│   └── AddIssueButton (only if logged in + edit mode ON)
└── MaintenanceSection
    ├── MaintenanceCard (edit buttons only if logged in + edit mode ON)
    └── AddMaintenanceButton (only if logged in + edit mode ON)
```

#### 7. User Flow

**First-time admin:**
1. Visit page (public view)
2. No edit toggle visible, only share button and hamburger (☰)
3. Tap ☰ → Menu opens showing [Login] button
4. Tap [Login] → Password modal opens
5. Enter password → On success, modal closes, menu closes
6. Edit toggle [Edit OFF] appears in header (yellow button)
7. Tap [Edit OFF] → Changes to [Edit ON], page shows edit mode indicator
8. All editing controls now active (tap-to-cycle, edit buttons)
9. Make edits
10. Tap [Edit ON] → Changes to [Edit OFF], controls hidden, page looks public
11. Close tab

**Returning admin (session persisted):**
1. Visit page → Automatically logged in (session token validated)
2. See [Edit OFF] yellow toggle in header
3. Edit mode is OFF by default
4. Tap [Edit OFF] → Changes to [Edit ON]
5. Start editing immediately

**Logout:**
1. Open hamburger menu (☰)
2. See "Logged in" status and [Logout] button
3. Tap [Logout] → Session cleared (localStorage + server-side)
4. Edit toggle disappears from header
5. Hamburger menu now shows [Login] button instead of [Logout]

#### 8. Implementation Checklist

**Phase 1: Session Persistence**
- [ ] Create `lib/session.ts` with localStorage helpers
- [ ] Create `POST /api/auth/login` endpoint (returns token)
- [ ] Create `GET /api/auth/verify` endpoint (validates token)
- [ ] Create `POST /api/auth/logout` endpoint (invalidates token)
- [ ] Update all mutation endpoints to accept `Authorization: Bearer <token>` header
- [ ] Add token validation middleware

**Phase 2: Hamburger Menu (Login/Logout)**
- [ ] Create `HamburgerMenu.tsx` component with slide-in animation
- [ ] Add hamburger icon (☰) to header (top right, always visible)
- [ ] Implement menu open/close state
- [ ] Show [Login] button in menu when not logged in
- [ ] Show "Logged in" status + [Logout] button in menu when logged in
- [ ] Wire [Login] button to open LoginModal
- [ ] Wire [Logout] button to clear session and reset state
- [ ] Remove current "Edit" button from header completely

**Phase 3: Login Modal & Edit Toggle**
- [ ] Create `LoginModal.tsx` component (password input modal)
- [ ] Create `EditToggle.tsx` component (yellow button, only Edit OFF/Edit ON)
- [ ] Add EditToggle to header (only visible when logged in)
- [ ] Wire EditToggle to toggle edit mode state
- [ ] Add edit mode state to StatusPageClient
- [ ] Edit mode defaults to OFF on page load (even if logged in)
- [ ] Add sessionStorage persistence for edit mode
- [ ] Add page-level visual indicator (border + floating badge) when edit mode ON

**Phase 4: Update Editing Controls**
- [ ] Update StatusPill to check `editable && sessionToken`
- [ ] Update IssueCard to check `editable && sessionToken`
- [ ] Update MaintenanceCard to check `editable && sessionToken`
- [ ] Update AddIssue/AddMaintenance buttons to check `editable && sessionToken`
- [ ] Pass sessionToken to all API calls instead of password

**Phase 5: Cleanup & Testing**
- [ ] Remove password prop from components (use sessionToken instead)
- [ ] Update all API calls to use `Authorization` header instead of password in body
- [ ] Add loading states for session verification on page load
- [ ] Test session expiration handling (expired token → auto-logout)
- [ ] Test edit mode toggle state persistence (sessionStorage)
- [ ] Test logout flow (clears localStorage, resets UI to Login state)

#### 9. API Request Changes

**Before (password in body):**
```typescript
fetch('/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'admin123', category, location, detail })
});
```

**After (token in header):**
```typescript
fetch('/api/issues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({ category, location, detail })
});
```

**API Route Changes:**
```typescript
// Before
const { password, category, location, detail } = await request.json();
const isValid = await verifyPassword(password);

// After
const authHeader = request.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const isValid = validateSessionToken(token);
```

#### 10. Security Considerations

**Session Token Storage:**
- localStorage is vulnerable to XSS but acceptable for prototype
- For production, consider httpOnly cookies + CSRF tokens
- Session tokens should be cryptographically random (32+ bytes)

**Token Expiration:**
- Default 7 days
- Validate expiration on every request
- Clear expired tokens from storage/database

**Logout:**
- Must clear both client (localStorage) and server (session store)
- Consider "logout all sessions" if implementing session store

**HTTPS:**
- Session tokens must only be transmitted over HTTPS in production
- Set `Secure` flag on cookies if using cookie-based sessions

#### 11. Open Questions

1. **Session storage:** In-memory (simple, resets on deploy) or Redis/DB (persistent)?
   - **Recommendation:** In-memory for prototype, Redis for production

2. **Token vs JWT:** Simple random token or JWT with claims?
   - **Recommendation:** Simple token for prototype (less complexity)

3. **Edit mode persistence:** sessionStorage (per-tab) or localStorage (per-browser)?
   - **Recommendation:** sessionStorage (safer default - edit mode doesn't persist across tabs)

4. **Visual indicator preference:** Border, badge, or banner?
   - **Recommendation:** Border + floating badge (Option A)

#### 12. Non-Goals (Out of Scope)

- Multi-user support (only one admin password)
- Role-based permissions
- Audit log of who edited what
- Password reset flow
- Two-factor authentication
- Session management UI (view/revoke active sessions)
