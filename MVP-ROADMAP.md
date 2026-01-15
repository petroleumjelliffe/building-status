# Building Status - MVP Roadmap

## Goal
Get a functional status page in residents' hands within 2 weeks, then iterate.

---

## Phase 1: MVP (Week 1) - "Good Enough to Ship"

### Priority 1A: Configuration File
**Why First:** Makes everything else reusable and maintainable
**Time:** 2 hours

- [ ] Create `config.json` with:
  - Building addresses and unit layouts
  - System types (heat, water, laundry, etc.)
  - Helpful links (rent portal, emergency contacts)
  - Garbage day schedule
  - Manager contact methods

- [ ] Refactor HTML to load from config
- [ ] Makes site reusable for other buildings

### Priority 1B: Helpful Links Section
**Why:** Easy win, high value for residents
**Time:** 2-3 hours

- [ ] Add section below maintenance
- [ ] Garbage days with visual calendar
- [ ] Important links (rent portal, policies, etc.)
- [ ] Emergency contacts with click-to-call
- [ ] All data from config.json

### Priority 1C: Simple Issue Reporting (mailto)
**Why:** Residents can report TODAY, upgrade UX later
**Time:** 1 hour

- [ ] "Report Issue" button opens mailto: link
- [ ] Pre-fills:
  - To: your-google-group@googlegroups.com
  - Subject: "[Building Status] Issue Report"
  - Body template with building/unit/category prompts
- [ ] Add note: "You'll receive a copy of your email for your records"

### Priority 1D: Manager Edit Mode - Static Password
**Why:** Core functionality, unblocks everything else
**Time:** 4-6 hours

- [ ] "Edit" button (top right corner, subtle)
- [ ] Prompt for password, store in sessionStorage
- [ ] Edit mode UI:
  - Toggle system statuses (OK/Issue/Down)
  - Edit issue descriptions inline
  - Add/remove maintenance items
  - Edit helpful links
- [ ] Save to `status-data.json` (committed to git)
- [ ] "Last updated by Manager at {timestamp}"
- [ ] Architecture ready for upgrade to email/SMS auth later

### MVP Launch Checklist
- [ ] Test on iPhone and Android
- [ ] Share with 2-3 friendly residents for feedback
- [ ] Deploy to GitHub Pages or Render
- [ ] Send announcement to google group
- [ ] Post printable QR code (even if basic)

**MVP Timeline:** 1 week (10-12 hours work)

---

## Phase 2: Better UX (Week 2-3)

### Priority 2A: Form Backend with Basin
**Why:** Better UX than mailto, autoresponder confirms submission
**Time:** 3-4 hours

- [ ] Set up Basin account (free tier: 100 submissions/month)
- [ ] Replace mailto with actual form POST
- [ ] Configure Basin to:
  - Forward to google group email
  - Send autoresponder to resident (if email provided)
  - Include reference number
- [ ] Update success message with reference number
- [ ] Test spam protection

### Priority 2B: Contact Preferences
**Why:** Residents want updates on their issues
**Time:** 2 hours

- [ ] Add optional email field to form
- [ ] Add optional phone field
- [ ] Checkbox: "I want updates on this issue"
- [ ] Include in Basin submission

### Priority 2C: Print Version (CSS + QR Code)
**Why:** Helps managers reach offline residents
**Time:** 3-4 hours

- [ ] Add "Print" button (or auto-detect @media print)
- [ ] Print stylesheet:
  - Single page, B&W friendly
  - Large QR code to status page
  - Current system status
  - Emergency contacts
  - Garbage schedule
- [ ] QR code generation (use qrcode.js library)
- [ ] Test on various printers

**Phase 2 Timeline:** 1-2 weeks (8-10 hours work)

---

## Phase 3: Auth Upgrade (Week 4-5)

### Priority 3A: Magic Link Authentication
**Why:** More secure, supports multiple managers
**Time:** 6-8 hours

- [ ] "Request Edit Access" button
- [ ] Enter email/phone
- [ ] Backend sends magic link (valid 15 min)
- [ ] Click link → authenticated session
- [ ] List of approved emails in config
- [ ] Keep static password as fallback

**Implementation Options:**
1. **Simple:** Firebase Auth (free tier, handles everything)
2. **Custom:** Netlify Functions + SendGrid
3. **Hybrid:** Passwordless.dev (2000 users free)

**Phase 3 Timeline:** 1-2 weeks (6-8 hours work)

---

## Phase 4: Nice to Have (Month 2+)

### Data & History
- [ ] Issue submission history (last 30 days)
- [ ] Manager dashboard to view all reports
- [ ] Export to CSV for records

### Enhanced Sharing
- [ ] "Copy as text" for Slack/Discord
- [ ] Auto-post to building social media
- [ ] SMS notifications (Twilio integration)

### More Systems
- [ ] Add: Elevator, Electricity, Internet, Parking
- [ ] Per-building status (if issues are localized)
- [ ] Status history graph (uptime %)

### PWA Features
- [ ] Add to home screen
- [ ] Offline mode (show last known status)
- [ ] Push notifications for status changes
- [ ] Background sync for form submissions

---

## Recommended MVP Feature Set

### Include in Week 1 Launch
✅ **Current status display** (already done)
✅ **Share with image** (already done)
✅ **Current issues list** (already done)
✅ **Scheduled maintenance** (already done)
✅ **Config-driven setup**
✅ **Helpful links section**
✅ **Simple issue reporting** (mailto)
✅ **Manager edit mode** (static password)

### Add in Week 2-3
🔶 **Form backend** (Basin)
🔶 **Contact preferences**
🔶 **Print version with QR**

### Hold for Later
⏸️ Magic link auth
⏸️ Issue history dashboard
⏸️ SMS notifications
⏸️ PWA features

---

## Architecture Decisions

### Data Storage - Phase 1 (MVP)
```
/building-status/
  ├── index.html
  ├── config.json          ← Building info, links, schedule
  ├── status-data.json     ← Current status (manager edits this)
  ├── styles.css
  └── app.js
```

**Manager Edit Flow:**
1. Manager clicks Edit → enters password
2. Edits status inline in browser
3. Clicks Save → JavaScript writes to status-data.json
4. Commits to git (via GitHub API or manual)

**Option A: Manual Commit** (Simplest)
- Manager edits, downloads updated JSON
- Emails to you or commits via GitHub web UI
- You push update to production

**Option B: GitHub API** (Automated)
- Manager edits, clicks Save
- JavaScript uses GitHub API to commit
- Requires: GitHub personal access token
- Auto-deploys via GitHub Pages webhook

**Recommendation:** Start with Option A, upgrade to B when managers are comfortable

### Form Submission - Phase 1 vs Phase 2

**Phase 1 (mailto):**
```html
<a href="mailto:your-group@googlegroups.com?subject=[Building Status] Issue Report&body=Building:%0A%0AUnit:%0A%0ACategory:%0A%0ADescription:%0A">
  Report an Issue
</a>
```

**Phase 2 (Basin):**
```html
<form action="https://usebasin.com/f/YOUR_FORM_ID" method="POST">
  <!-- Your existing form fields -->
</form>
```

Basin setup:
- Forwards to google group email
- Sends autoresponder with: "We received your report about {category}. Reference #BS-{id}. We'll update the status page when we know more."
- Free tier: 100/month (plenty for a building)

### Authentication Evolution

**Phase 1: Static Password**
```javascript
const EDIT_PASSWORD = 'building2026'; // In code for now
// Later: Move to environment variable
```

**Phase 3: Magic Link**
```javascript
const APPROVED_MANAGERS = [
  'manager1@example.com',
  'manager2@example.com'
]; // Lives in config, expandable
```

---

## Implementation Notes

### Config File Structure
```json
{
  "buildings": {
    "712": {
      "address": "712 Main St",
      "units": ["A", "B", "C", "D"],
      "floors": [1, 2, 3, 4]
    },
    "706": {
      "address": "706 Main St",
      "units": ["E", "F"],
      "floors": [1, 2, 3, 4]
    },
    "702": {
      "address": "702 Main St",
      "units": ["G", "H", "I", "J"],
      "floors": [1, 2, 3, 4]
    }
  },
  "systems": [
    { "id": "heat", "name": "Heat", "icon": "🔥" },
    { "id": "water", "name": "Water", "icon": "💧" },
    { "id": "laundry", "name": "Laundry", "icon": "🧺" }
  ],
  "helpfulLinks": [
    { "title": "Pay Rent Online", "url": "https://..." },
    { "title": "Building Policies", "url": "https://..." },
    { "title": "Maintenance Requests", "url": "https://..." }
  ],
  "contacts": [
    { "label": "Building Manager", "phone": "555-123-4567" },
    { "label": "Emergency Maintenance", "phone": "555-987-6543" },
    { "label": "Non-Emergency", "phone": "555-111-2222" }
  ],
  "garbageSchedule": {
    "trash": ["Tuesday", "Friday"],
    "recycling": ["Friday"],
    "notes": "Set out by 7am"
  },
  "reportEmail": "your-group@googlegroups.com"
}
```

### Status Data Structure
```json
{
  "lastUpdated": "2026-01-15T14:45:00Z",
  "updatedBy": "Manager",
  "systems": {
    "heat": { "status": "issue", "count": "2/3", "note": "Bldg A boiler" },
    "water": { "status": "ok", "count": "3/3" },
    "laundry": { "status": "ok", "count": "2/3" }
  },
  "issues": [
    {
      "id": "1",
      "category": "Heat",
      "location": "Bldg A",
      "icon": "🔥",
      "status": "investigating",
      "detail": "Boiler tech scheduled for tomorrow AM",
      "reported": "2 hrs ago"
    }
  ],
  "maintenance": [
    { "date": "Thu, Jan 8", "desc": "Plumber coming to repair Washer 2" }
  ]
}
```

---

## Success Criteria

### MVP Launch (End of Week 1)
- [ ] 5 beta testers successfully viewed status
- [ ] 2 test issue reports submitted (via mailto)
- [ ] Manager successfully updated status
- [ ] Page loads in < 2 seconds on mobile
- [ ] Works on iOS Safari and Android Chrome

### Phase 2 Complete (End of Week 3)
- [ ] 10+ issue reports via Basin form
- [ ] 100% of residents aware of status page
- [ ] Manager updates status at least weekly
- [ ] Print version posted in all building entrances

### Success Metrics (Month 1)
- 60%+ resident adoption (unique visitors)
- <4 hour average response time to issues
- 90%+ resident satisfaction with communication

---

## Quick Start: What to Build First

If you want to ship something TODAY, here's the 4-hour MVP:

1. **Hour 1:** Create config.json with building/unit data
2. **Hour 2:** Add helpful links section (garbage, contacts, links)
3. **Hour 3:** Add mailto: button for issue reporting
4. **Hour 4:** Deploy to GitHub Pages, send link to residents

That gives you a functional status page residents can use immediately.

**Then next week:**
- Add manager edit mode (6 hours)
- Upgrade to Basin form (3 hours)
- Add print version (3 hours)

---

## Questions for You

Before I start building, let's confirm:

1. **Google group email address?** (for mailto and Basin forwarding)
2. **Static password?** (suggest something easy for managers to remember)
3. **Hosting preference?** GitHub Pages or Render? (GitHub Pages is simpler for static site)
4. **Building addresses** - are "712", "706", "702" the full addresses, or should I format as "712 [Street Name]"?
5. **Launch date?** When do you want residents to have access?

Ready to start with Phase 1A (config file) whenever you are!
