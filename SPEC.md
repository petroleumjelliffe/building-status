# Building Status - Product Specification

## Overview

A simple, shareable status page for apartment building residents to view system status, report issues, and access important information. Designed for easy sharing via social media with auto-generated status images.

## Goals

1. **Easy Status Sharing** - One tap to share current building status with image preview
2. **Instant Issue Reporting** - Simple form with immediate acknowledgment
3. **Manager-Friendly Updates** - Quick status and notification updates
4. **Always Accessible** - Single URL residents can bookmark and share

## User Personas

### Residents
- Need to quickly check if systems are working before reporting
- Want to report issues and get confirmation
- Need helpful links and garbage day reminders
- Share status with neighbors and building management

### Building Managers
- Update system status and post maintenance notices
- Receive issue reports via email
- Share status updates with residents quickly
- Want professional-looking status summaries

---

## Configuration-Driven Architecture

All content on the status page is dynamically loaded from a JSON configuration file served by Val Town. This allows building managers to update content without touching code.

### Configuration Structure

The entire page is rendered from a single config object with the following structure:

#### Buildings Configuration
```json
{
  "buildings": {
    "712": {
      "name": "712",
      "units": ["A", "B", "C", "D"],
      "floors": [4, 3, 2, 1]
    }
  }
}
```
- **Purpose**: Defines building layouts for the report form
- **Display**: Used in building/unit selection interface
- **Editable by**: Manager (via Val Town config edit)

#### Systems Configuration
```json
{
  "systems": [
    {
      "id": "heat",
      "name": "Heat",
      "icon": "🔥",
      "label": "Heat"
    }
  ]
}
```
- **Purpose**: Defines which systems are tracked
- **Display**: Rendered as status pills in Systems section
- **Dynamic behavior**: Status color changes based on `status.systemStatus[id].status`

#### Helpful Links
```json
{
  "helpfulLinks": [
    {
      "title": "Building Policies",
      "url": "https://example.com/policies",
      "icon": "📋"
    }
  ]
}
```
- **Display**: Rendered as clickable link cards
- **When empty**: Section hidden
- **Behavior**: Opens in new tab

#### Contacts
```json
{
  "contacts": [
    {
      "label": "Bujar - Superintendent",
      "phone": "555-123-4567",
      "hours": "Mon-Fri 9am-5pm"
    }
  ]
}
```
- **Display**: Contact cards with tap-to-call phone numbers
- **Format**: Phone link for mobile devices
- **Privacy**: Kept private via Val Town (not in public GitHub repo)

#### Garbage Schedule
```json
{
  "garbageSchedule": {
    "trash": {
      "days": ["Tuesday", "Friday"],
      "time": "7:00 AM"
    },
    "recycling": {
      "days": ["Friday"],
      "time": "7:00 AM"
    },
    "notes": "Set out by 7am on collection day"
  }
}
```
- **Display**: Two-column grid with trash and recycling cards
- **Note field**: Rendered below grid in italic style
- **Time field**: Optional - can be omitted

#### Report Email
```json
{
  "reportEmail": "building-status@example.com"
}
```
- **Purpose**: Email address for issue reports
- **Display**: Used in mailto: link on "Report an Issue" button
- **Privacy**: Kept private via Val Town

#### Status Data
```json
{
  "status": {
    "lastUpdated": "2026-01-15T14:45:00Z",
    "pinnedNotifications": [
      {
        "type": "warning",
        "message": "Heat will be off Tuesday 9am-12pm",
        "expiresAt": "2026-01-20T12:00:00Z"
      }
    ],
    "systemStatus": {
      "heat": {
        "status": "issue",
        "count": "2/3",
        "note": "Bldg A"
      }
    },
    "currentIssues": [
      {
        "category": "Heat",
        "location": "Bldg A",
        "icon": "🔥",
        "status": "investigating",
        "detail": "Boiler tech scheduled for tomorrow AM",
        "reported": "2 hrs ago"
      }
    ],
    "scheduledMaintenance": [
      {
        "date": "Thu, Jan 8",
        "description": "Plumber coming to repair Washer 2"
      }
    ]
  }
}
```

**lastUpdated**
- **Format**: ISO 8601 timestamp
- **Display**: Formatted as "Updated Jan 15, 2026 • 2:45 PM" in header
- **Manager action**: Update this timestamp whenever config changes

**pinnedNotifications**
- **Display**: Colored banner at top of page
- **Types**: warning (yellow), info (blue), alert (red)
- **Auto-expiration**: Notifications with `expiresAt` automatically hide after that date
- **When empty**: No banner shown
- **Icons**: ⚠️ for warning, ℹ️ for info, 🚨 for alert

**systemStatus**
- **Keys**: Match system IDs from `systems` array
- **status values**: "ok" (green), "issue" (yellow), "down" (red)
- **count format**: "working/total" (e.g., "2/3")
- **note field**: Optional additional context
- **Display**: Affects status pill color and Open Graph image

**currentIssues**
- **Display**: Issue cards in "Current Issues" section
- **status values**: "reported" (red badge), "investigating" (yellow badge)
- **When empty**: Shows "No issues reported" with checkmark
- **Fields**:
  - `category`: Issue type (text)
  - `location`: Where the issue is (text)
  - `icon`: Emoji for visual recognition
  - `status`: Current state
  - `detail`: Description and next steps
  - `reported`: Relative time (e.g., "2 hrs ago")

**scheduledMaintenance**
- **Display**: Maintenance cards in "Scheduled Maintenance" section
- **When empty**: Shows "No scheduled maintenance"
- **date format**: Human-readable (e.g., "Thu, Jan 8")
- **Fields**:
  - `date`: When it will happen
  - `description`: What work is being done

### Dynamic Content Rendering

All sections render automatically when the page loads:
1. **Header**: lastUpdated timestamp formatted
2. **Pinned Notifications**: Filtered for non-expired items
3. **Systems Status**: Pills colored based on systemStatus
4. **Current Issues**: List or "all clear" message
5. **Scheduled Maintenance**: List or "none scheduled" message
6. **Garbage Schedule**: Days/times from config
7. **Helpful Links**: Link cards (section hidden if empty array)
8. **Important Contacts**: Contact cards with phone links
9. **Report Button**: mailto: uses reportEmail

### Open Graph Social Media Image

The page dynamically updates its social sharing preview image based on current system status:

**URL Format**: `https://[val-town-url]/h{heat}w{water}l{laundry}.png`
- Example: `/h23w33l33.png` means heat=2/3, water=3/3, laundry=3/3
- Slashes are removed from counts for URL compatibility
- Updates automatically when systemStatus changes in config
- Used in meta tag `og:image` for social media previews

---

## Feature Specifications

### 1. Status Page (Resident View)

#### 1.1 System Status Display
**Current Implementation:** ✅ Complete
- Visual status pills for major systems (Heat, Water, Laundry)
- Color-coded indicators (green=OK, yellow=issue, red=down)
- Count format shows "working/total" (e.g., "2/3")
- Emoji icons for quick visual recognition

**Enhancement Opportunities:**
- Add more systems (electricity, internet, garbage collection)
- Show individual building status if multi-building complex
- Toggle between summary and detailed view

#### 1.2 Social Media Preview
**Current Implementation:** ✅ Complete
- Open Graph meta tags configured
- Dynamic image generation based on status
- Image format: `h{heat}w{water}l{laundry}.png`
- 600x315px for optimal social media display

**Requirements:**
- Image updates automatically when status changes
- Shows summary like: "Heat: 2/3 • Water: 3/3 • Laundry: 2/3"
- Clean, readable design that works at small sizes
- Building name/address on the image

#### 1.3 Share Functionality
**Current Implementation:** ✅ Complete
- Native share sheet integration
- Falls back to clipboard copy on unsupported devices
- Shares with pre-generated status image
- Loading state during share operation

**Enhancements:**
- Quick copy status as text for Slack/Discord
- Save image to device option
- Share to specific platform (WhatsApp, SMS) shortcuts

#### 1.4 Current Issues List
**Current Implementation:** ✅ Complete
- Issue cards with category, location, and status
- Status badges (Reported, Investigating)
- Timestamp showing how long ago reported
- Color-coded severity (yellow=investigating, red=reported)

**Data Displayed:**
- Issue type with emoji
- Location/system affected
- Current status (Reported, Investigating, Scheduled)
- Description of issue and next steps
- Time reported (relative format)

#### 1.5 Scheduled Maintenance
**Current Implementation:** ✅ Complete
- Maintenance cards with date and description
- Date format: "Thu, Jan 8"
- Yellow accent border for visibility

**Enhancements:**
- Add time if known
- Mark as "Today" or "Tomorrow" when relevant
- Show if maintenance will affect specific buildings/units
- Add calendar export (.ics file)

#### 1.6 Helpful Information Section
**Status:** 🔴 Not Implemented

**Requirements:**
- Garbage collection schedule
  - Day of week with optional time window
  - Recycling vs trash vs compost
  - Holiday schedule exceptions

- Important Links
  - Rent payment portal
  - Maintenance request form (if different from status page)
  - Building policies/rules document
  - Emergency contacts
  - Local utility companies

- Important Phone Numbers
  - Building manager
  - Emergency maintenance
  - Non-emergency city services
  - Nearby hospital/urgent care

**Design:**
- Collapsible sections to reduce page length
- Icons for quick scanning
- Click-to-call for phone numbers
- Click-to-copy for addresses

---

### 2. Issue Reporting Form

#### 2.1 Building & Unit Selection
**Current Implementation:** ✅ Complete
- Tab selector for building (712, 706, 702)
- Novel grid UI for unit selection
- Grid adapts to building layout (different unit counts)
- Visual feedback on selected unit

**Unit Grid Features:**
- 4 floors × variable units per building
- Unit naming: {floor}{letter} (e.g., "4A")
- Button grid with clear selected state
- Mobile-friendly tap targets

**Enhancements:**
- Remember last-selected building/unit in localStorage
- Support for sub-units (4A-1, 4A-2) if needed
- Display selected unit prominently before submission

#### 2.2 Issue Category Selection
**Current Implementation:** ✅ Complete
- Dropdown with emoji-prefixed categories
- Categories: Heat, Hot Water, Water Leak, Laundry, Hallway Light, Door/Lock, Other

**Enhancement Opportunities:**
- Dynamic categories based on current known issues
- Priority/urgency selector for emergencies
- Photo upload capability
- Suggested questions based on category (e.g., "Is this an emergency?")

#### 2.3 Description Field
**Current Implementation:** ✅ Complete
- Optional textarea for additional details
- Placeholder text guides users
- Resizable for longer descriptions

**Enhancements:**
- Character counter (max 500 chars)
- Template suggestions: "The {system} has been {problem} since {when}"
- Voice-to-text button for accessibility

#### 2.4 Contact Preferences
**Status:** 🔴 Not Implemented

**Requirements:**
- Optional email input for updates
- Optional phone number for urgent issues
- Checkbox: "Text me when status changes"
- Checkbox: "Email me when resolved"
- Privacy note: "We'll only contact you about this issue"

**Validation:**
- Email format validation
- Phone format (xxx-xxx-xxxx) with auto-formatting
- Both fields optional but at least one recommended

#### 2.5 Submission & Confirmation
**Current Implementation:** ✅ Complete
- Submit button with loading state
- Success screen with checkmark
- Auto-reset after 5 seconds
- Shows confirmation message

**Enhancement Requirements:**
- Issue reference number (e.g., "#BS-2026-001")
- Copy of submission sent to resident email if provided
- Estimated response time
- Link to check status of this specific report

**Manager Notification:**
- Email sent to manager inbox with:
  - Subject: "[Building Status] {Category} reported - Unit {unit}"
  - All form data formatted
  - Direct reply-to resident email if provided
  - Timestamp
  - Link to mark issue as "investigating" or "resolved"

---

### 3. Manager Features

#### 3.1 Edit Mode
**Status:** 🔴 Not Implemented

**Requirements:**
- Password/PIN-protected edit mode
- Toggle switch to enter edit mode
- Inline editing of status values
- Save/Cancel buttons

**Editable Elements:**
- System status (OK/Issue/Down) for each system
- Current issue descriptions
- Scheduled maintenance items
- Helpful links and information
- Garbage day schedule

**UI Design:**
- Visual distinction for edit mode (border/background color)
- Inline editors appear on click
- Undo changes button
- "Last updated by {name} at {time}"

**Data Persistence:**
- Save to JSON file or simple database
- Version history (last 10 changes)
- Rollback capability
- Auto-save drafts

#### 3.2 Status Update Workflow
**Status:** 🔴 Not Implemented

**Quick Actions:**
- Mark system as OK/Issue/Down
- Add new issue to list
- Update existing issue status
- Post new maintenance notice
- Pin important announcement to top

**Update Templates:**
- "System back online"
- "Repair scheduled for {date}"
- "Investigating issue"
- "Waiting for parts/contractor"

#### 3.3 Notification Management
**Status:** 🔴 Not Implemented

**Pinned Announcements:**
- Banner at top of page for urgent notices
- Auto-expire after set date
- Examples:
  - "Heat will be off Tuesday 9am-12pm for annual inspection"
  - "New garbage schedule starts next week"
  - "Reminder: Rent due Friday"

**Push Capabilities (Future):**
- Optional resident email list
- Send update notifications when status changes
- Digest mode (daily summary vs. real-time)

#### 3.4 Manager Share Feature
**Current Implementation:** ✅ Complete (same as resident)

**Enhancement:**
- "Share Update" button after making status changes
- Auto-generates message: "Building status updated: {changes}"
- Includes fresh status image with current data
- Option to post to building's social media directly (if integrated)

---

### 4. Printable Version

**Status:** 🔴 Not Implemented

#### 4.1 Print Layout
**Trigger:** Print button or CSS `@media print`

**Content:**
- Building name and address prominently
- QR code linking to status page
- Current date printed
- System status summary
- Most important contact numbers
- Garbage day schedule
- Emergency procedures

**Design:**
- Black and white printer-friendly
- Single page if possible, max 2 pages
- Large QR code (2-3 inches)
- High contrast text
- No photos/complex graphics

#### 4.2 QR Code
**Requirements:**
- Links to the status page URL
- Minimum 2" × 2" for easy scanning
- Error correction: Level H (high)
- Test with various phone cameras

**Use Cases:**
- Post in building entrance
- Include in welcome packets for new residents
- Hand out at building meetings
- Mail to residents without smartphones

#### 4.3 Important Information
**Print-Only Content:**
- Fire/police/ambulance: 911
- Building emergency number
- Non-emergency maintenance
- After-hours emergency
- Gas/electric company emergency
- Water department
- Poison control
- Nearest hospital address

**Layout:**
- Table format for easy scanning
- Bold labels
- Large font (14pt minimum)

---

## Technical Architecture

### 5.1 Current Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Fonts:** DM Sans, DM Mono (Google Fonts)
- **Image Generation:** External service (petroleumjelliffe.web.val.run)
- **Hosting:** Static site (can be GitHub Pages, Netlify, etc.)

### 5.2 Data Management

**Current:** Hard-coded in HTML

**Recommended:**
```javascript
// status-data.json
{
  "lastUpdated": "2026-01-15T14:45:00Z",
  "systems": {
    "heat": { "status": "issue", "count": "2/3", "note": "Bldg A" },
    "water": { "status": "ok", "count": "3/3" },
    "laundry": { "status": "ok", "count": "2/3" }
  },
  "issues": [...],
  "maintenance": [...],
  "info": {
    "garbageDays": ["Tuesday", "Friday"],
    "links": [...],
    "contacts": [...]
  }
}
```

**Benefits:**
- Manager can edit JSON file directly
- Easy to version control
- Faster page loads (data cached)
- Simpler backup/restore

### 5.3 Form Submission Backend

**Options:**

1. **Formspree / FormSubmit** (Easiest)
   - Free tier: 50 submissions/month
   - Direct email delivery
   - No backend coding needed
   - Setup: Add endpoint to form action

2. **Netlify Forms** (If hosted on Netlify)
   - Built-in form handling
   - Email notifications
   - Spam filtering included
   - Serverless function for custom logic

3. **Custom Backend** (Most Flexible)
   - Node.js + Express
   - Send email via SendGrid/AWS SES
   - Store submissions in database
   - Build manager dashboard

**Recommended:** Start with Formspree, migrate to custom backend when needed

### 5.4 Edit Mode Authentication

**Simple Option:**
- Prompt for PIN code (4-6 digits)
- Store hash in localStorage
- Good enough for low-security needs

**Better Option:**
- OAuth with Google/Microsoft
- Email-based magic links
- Role-based access (multiple managers)

**Enterprise Option:**
- SSO integration
- Audit logs
- Multi-factor authentication

### 5.5 Image Generation Service

**Current:** External service generates status images

**Requirements:**
- Dynamic generation based on status codes
- Format: `h{heat}w{water}l{laundry}.png`
- Supports all status combinations (3³ = 27 images)
- Caching for performance
- Fallback to generic image if service down

**Alternative Approach:**
- Client-side Canvas rendering
- Generate image in browser before share
- No external dependency
- Slower on initial generation

---

## User Experience Flows

### 6.1 Resident Checks Status
1. Opens bookmark/link to status page
2. Sees at-a-glance system status (green/yellow/red)
3. Reads current issues if any shown
4. Checks scheduled maintenance
5. Optionally reports new issue

**Time to value:** < 5 seconds

### 6.2 Resident Reports Issue
1. Scrolls to "Report an Issue" form
2. Selects building (if multi-building)
3. Taps unit on grid (e.g., 4A)
4. Selects issue category from dropdown
5. Optionally adds description
6. Optionally adds email/phone for updates
7. Taps "Submit Report"
8. Sees success confirmation with reference number
9. Receives email confirmation if email provided

**Time to complete:** 30-60 seconds

### 6.3 Resident Shares Status
1. Taps "Share Status" button
2. Status image generates (with heat/water/laundry counts)
3. Native share sheet opens
4. Selects Messages, WhatsApp, Email, etc.
5. Image and link pre-populated in message
6. Sends to neighbor or building chat

**Time to complete:** 10-15 seconds

### 6.4 Manager Updates Status
1. Navigates to status page
2. Taps "Edit" button
3. Enters PIN/password
4. Inline editors appear on status items
5. Updates system status (e.g., Heat: Issue → OK)
6. Adds note: "Boiler repaired, heat restored"
7. Taps "Save Changes"
8. Page updates immediately
9. Optionally taps "Share Update" to notify residents

**Time to complete:** 60-90 seconds

### 6.5 Manager Receives Issue Report
1. Email arrives: "[Building Status] Heat reported - Unit 4A"
2. Opens email, sees all details
3. Assesses issue
4. Replies to resident directly (if email provided)
5. Updates status page to show issue as "Investigating"
6. Schedules repair
7. Updates status page with maintenance schedule
8. When resolved, marks issue as "Resolved"

---

## Mobile Considerations

### Design Principles
- Mobile-first design (most residents will use phones)
- Touch targets minimum 44×44px
- Readable at arm's length (16px base font minimum)
- Works offline (cache status data)
- Fast load time (< 2s on 3G)

### Interactions
- Tap, don't hover
- Swipe gestures for advanced features
- Pull-to-refresh status
- Bottom sheet for forms (iOS-style)

### Progressive Web App (Future)
- Add to home screen
- Push notifications for status changes
- Offline mode shows last-known status
- Background sync for form submissions

---

## Analytics & Monitoring

### Metrics to Track
- Page views per day
- Share button usage
- Issue reports submitted
- Most common issue categories
- Time between updates
- Manager edit frequency

### Tools
- Google Analytics 4 (privacy-friendly)
- Simple server logs
- Submission counts in form service

### Privacy
- No personal data collection without consent
- Contact info only for issue follow-up
- Clear data retention policy
- GDPR/CCPA compliance if applicable

---

## Security & Privacy

### Data Protection
- HTTPS only
- No sensitive data in URLs
- Form submissions encrypted in transit
- Manager authentication required for edits
- Rate limiting on form submissions (prevent spam)

### Access Control
- Public: Status page, issue reporting
- Protected: Edit mode, submission history
- Admin: User management, analytics

### Spam Prevention
- Honeypot field in form
- reCAPTCHA if spam becomes issue
- Rate limiting (max 5 submissions per IP per hour)
- Form submission review queue

---

## Accessibility

### WCAG 2.1 AA Compliance
- Color contrast ratios meet minimum 4.5:1
- All interactive elements keyboard accessible
- Screen reader tested
- Focus indicators visible
- Form labels properly associated
- ARIA landmarks for page structure

### Specific Features
- Status indicators use color + icon + text
- Skip to content link
- Form errors announced to screen readers
- Mobile zoom doesn't break layout
- Print version accessible to screen readers

---

## Future Enhancements

### Phase 2
- Email/SMS notifications when status changes
- Manager dashboard with submission history
- Multi-language support
- Dark mode (already styled for it)
- Custom branding per building

### Phase 3
- Resident accounts (track their submissions)
- Comments/updates on issues
- Photo uploads for issue reports
- Mobile app (iOS/Android)
- Integration with property management software

### Phase 4
- Automated status updates (IoT sensors)
- Preventive maintenance scheduling
- Community board/announcements
- Document sharing (leases, policies)
- Payment integration

---

## Success Metrics

### User Adoption
- **Goal:** 60% of residents use within 3 months
- **Measure:** Unique visitors, return rate

### Issue Resolution
- **Goal:** Reduce response time by 50%
- **Measure:** Time from report to manager acknowledgment

### Communication
- **Goal:** 80% resident awareness of maintenance
- **Measure:** Survey responses, fewer "when will this be fixed?" calls

### Satisfaction
- **Goal:** 4.5/5 rating from residents
- **Measure:** Periodic surveys, app store ratings (if mobile app)

---

## Implementation Priorities

### Must Have (MVP)
- [x] Status display with heat/water/laundry
- [x] Share functionality with image
- [x] Issue reporting form
- [x] Building/unit selection grid
- [x] Current issues list
- [x] Scheduled maintenance
- [ ] Manager edit mode
- [ ] Form submission to email
- [ ] Helpful links section
- [ ] Garbage day schedule

### Should Have (v1.1)
- [ ] Contact preferences in form
- [ ] Printable version
- [ ] More system types (additional utilities)
- [ ] Issue reference numbers
- [ ] Auto-expiring announcements

### Nice to Have (v2.0)
- [ ] Resident accounts
- [ ] Push notifications
- [ ] Photo uploads
- [ ] Manager dashboard
- [ ] Analytics

---

## Development Roadmap

### Week 1-2: Core Features
- Set up form submission backend
- Implement manager edit mode
- Add helpful links section
- Create printable version

### Week 3-4: Polish & Testing
- User testing with 5-10 residents
- Manager training and feedback
- Bug fixes and refinements
- Documentation

### Week 5: Launch
- Deploy to production
- Send announcement to all residents
- Print and post QR code flyers
- Monitor for issues

### Ongoing
- Weekly status check-ins
- Monthly feature additions based on feedback
- Quarterly user surveys

---

## Questions & Decisions Needed

1. **Multi-building setup:** Are 712, 706, 702 all part of same property or separate?
2. **Manager access:** How many managers need edit access? Shared PIN or individual accounts?
3. **Email service:** Which email should receive issue reports?
4. **Hosting:** GitHub Pages, Netlify, or custom server?
5. **Custom domain:** Will this have its own domain (e.g., status.yourbuilding.com)?
6. **Notification strategy:** Email only, or add SMS for emergencies?
7. **Historical data:** Keep archive of past issues, or just current status?
8. **Image generation:** Keep external service or move to client-side rendering?

---

## Appendix: Example Data Structures

### Issue Object
```json
{
  "id": "BS-2026-001",
  "timestamp": "2026-01-15T10:30:00Z",
  "building": "712",
  "unit": "4A",
  "category": "heat",
  "description": "Radiator cold, no heat in bedroom",
  "status": "investigating",
  "contactEmail": "resident@example.com",
  "contactPhone": "555-123-4567",
  "updates": [
    {
      "timestamp": "2026-01-15T11:00:00Z",
      "status": "investigating",
      "note": "Boiler tech scheduled for tomorrow AM"
    }
  ]
}
```

### System Status Object
```json
{
  "system": "heat",
  "status": "issue",
  "count": "2/3",
  "locations": ["712", "706"],
  "affectedUnits": ["4A", "4B", "3A"],
  "notes": "Bldg A boiler issue",
  "lastUpdated": "2026-01-15T14:45:00Z"
}
```

### Maintenance Event Object
```json
{
  "id": "MAINT-001",
  "date": "2026-01-20",
  "time": "09:00-12:00",
  "title": "Annual boiler inspection",
  "description": "All buildings will be without heat during inspection",
  "affectedSystems": ["heat"],
  "affectedBuildings": ["712", "706", "702"],
  "posted": "2026-01-10T08:00:00Z"
}
```
