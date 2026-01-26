# Building Status App - Customer Journey

This document maps the complete customer journey for both residents and building managers using the Building Status application, highlighting touchpoints, pain points, and opportunities for improvement.

## Journey Map

```mermaid
journey
    title Building Status App - Customer Journey

    section Discovery & Access
      Receives QR code in welcome packet: 3: Resident
      Scans QR code with phone: 4: Resident
      Bookmarks status page URL: 5: Resident
      Sets up property in admin panel: 3: Manager
      Generates QR codes for residents: 4: Manager

    section Daily Status Check
      Opens bookmark to check systems: 5: Resident
      Views at-a-glance status pills: 5: Resident
      Reads current issues: 4: Resident
      Checks upcoming events: 4: Resident
      Shares status with neighbors: 5: Resident

    section Issue Discovery
      Discovers system problem (no heat): 1: Resident
      Opens status page to verify: 3: Resident
      Sees issue already reported: 5: Resident
      OR finds no existing report: 2: Resident

    section Issue Reporting
      Clicks "Report issue" button: 4: Resident
      Email client opens with template: 5: Resident
      Describes problem and sends: 4: Resident
      Receives email notification: 4: Manager
      Reviews issue details: 3: Manager

    section Issue Response
      Logs into admin panel: 4: Manager
      Switches to edit mode: 5: Manager
      Adds issue to "Current Issues": 4: Manager
      Updates system status to "Issue": 4: Manager
      Saves changes: 5: Manager
      Resident sees update on page: 5: Resident

    section Maintenance Scheduling
      Schedules contractor visit: 3: Manager
      Adds event to calendar: 4: Manager
      Posts maintenance notice: 4: Manager
      Resident checks upcoming events: 5: Resident
      Subscribes to calendar feed: 5: Resident
      Receives calendar reminder: 5: Resident

    section Issue Resolution
      Contractor fixes problem: 5: Manager
      Manager marks issue resolved: 4: Manager
      Updates system status to OK: 5: Manager
      Posts completion announcement: 4: Manager
      Resident sees green status: 5: Resident
      Resident confirms fix in unit: 5: Resident

    section Ongoing Communication
      Manager posts upcoming events: 4: Manager
      Shares garbage schedule updates: 4: Manager
      Updates contact information: 4: Manager
      Resident checks weekly for updates: 5: Resident
      Resident uses calendar subscription: 5: Resident
      Shares updates with neighbors: 5: Resident

    section Emergency Scenario
      Major outage occurs (water): 1: Resident, Manager
      Multiple residents check page: 2: Resident
      Manager updates status immediately: 3: Manager
      Posts urgent announcement: 4: Manager
      Updates ETA for restoration: 4: Manager
      Residents share status widely: 4: Resident
      Issue resolved and confirmed: 5: Resident, Manager

    section QR Access Management
      Manager creates resident QR code: 4: Manager
      Labels code for tracking: 4: Manager
      Downloads QR code image: 5: Manager
      Sends to resident via email: 4: Manager
      Resident scans to unlock contacts: 5: Resident
      90-day session auto-renews: 5: Resident
      Manager can deactivate if needed: 4: Manager
```

## Satisfaction Scale

- **1** = Very frustrated
- **2** = Frustrated
- **3** = Neutral
- **4** = Satisfied
- **5** = Very satisfied

## Key Insights

### Resident Pain Points

| Touchpoint | Score | Issue | Impact |
|------------|-------|-------|--------|
| Discovering a system problem | 1/5 | Stressful moment of uncertainty | High anxiety, immediate need for information |
| Finding no existing report | 2/5 | Uncertainty about whether to report | May lead to duplicate reports or underreporting |
| Checking status during major outage | 2/5 | High anxiety, need for updates | Multiple refreshes, information seeking behavior |

### Resident Delight Points

| Touchpoint | Score | Why It Works | Value |
|------------|-------|--------------|-------|
| Seeing issue already reported | 5/5 | Relief that manager is aware | Reduces anxiety, builds trust |
| QR code access simplicity | 5/5 | Seamless authentication | No passwords to remember, quick access |
| Calendar subscription | 5/5 | Proactive notifications | Reduces need to check page manually |
| Seeing green status after fix | 5/5 | Confirmation problem solved | Peace of mind, closure |
| At-a-glance status pills | 5/5 | Immediate visual feedback | 5-second time to value |

### Manager Pain Points

| Touchpoint | Score | Issue | Impact |
|------------|-------|-------|--------|
| Receiving multiple reports for same issue | 2/5 | No automatic deduplication | Email overload, manual filtering needed |
| Reviewing issue details in email | 3/5 | Plain text format, no quick actions | Must copy/paste to admin panel |
| Scheduling maintenance | 3/5 | Manual calendar entry | Time-consuming, potential for errors |
| Emergency response time | 3/5 | Must be at computer to update | Delayed communication during off-hours |

### Manager Delight Points

| Touchpoint | Score | Why It Works | Value |
|------------|-------|--------------|-------|
| Edit mode efficiency | 5/5 | Quick inline updates | 60-90 second update time |
| QR code generation | 5/5 | Easy resident onboarding | Professional, trackable access |
| Immediate status publishing | 5/5 | No deploy or build needed | Real-time communication |
| All data in one place | 4/5 | Single source of truth | Reduces information scatter |

## Critical User Journeys

### 1. Emergency Response (Water Main Break)

**Timeline:**
- **T+0 min**: Water main breaks, multiple residents discover simultaneously
- **T+5 min**: 3-5 residents email/call manager
- **T+10 min**: Manager logs in, switches to edit mode
- **T+12 min**: Updates water status to "Down", adds issue description
- **T+13 min**: Posts announcement with ETA
- **T+15 min**: Residents see update, stop calling/emailing

**Current Pain Points:**
- 15-minute communication lag
- Manager overwhelmed with duplicate reports
- No mobile-friendly emergency update flow

**Improvement Opportunities:**
- Quick update via mobile
- Auto-response to issue emails: "We're aware, check status page for updates"
- SMS/push notifications for emergencies

### 2. Routine Maintenance Notification

**Timeline:**
- **Week -1**: Contractor schedules annual boiler inspection
- **Week -1**: Manager posts event with 1-week notice
- **Week -1, Day 1**: Residents with calendar subscription get notification
- **Week -1, Day 3**: Manager posts reminder announcement
- **Day 0**: Maintenance occurs, residents prepared
- **Day 0, +2 hours**: Manager updates status to "OK", posts completion

**Current Success Factors:**
- Calendar subscription works well (5/5 satisfaction)
- Clear advance notice reduces complaints
- Status updates provide confirmation

**Improvement Opportunities:**
- Email digest for non-calendar users
- Building-specific notifications (don't notify everyone for single-building work)
- Automatic "work completed" confirmations

### 3. New Resident Onboarding

**Timeline:**
- **Day 1**: New resident moves in
- **Day 1**: Receives welcome packet with QR code
- **Day 1 or 2**: Scans QR code, bookmarks page
- **Day 2-7**: Checks status page 2-3 times
- **Week 2**: First issue report or event check
- **Month 1**: Regular weekly checks, shares with guests

**Current Success Factors:**
- QR code scanning is effortless (5/5)
- 90-day session means no re-authentication
- Visual design is intuitive, no training needed

**Improvement Opportunities:**
- Welcome announcement for new residents
- Quick-start guide in welcome packet
- FAQ section on status page

## Opportunities for Improvement

### High Priority (Address Major Pain Points)

1. **Mobile Emergency Updates**
   - Problem: Managers need computer access to post updates during emergencies
   - Solution: Mobile-optimized edit mode, or SMS-to-update feature
   - Impact: Reduce emergency response time from 15min to 5min

2. **Duplicate Report Detection**
   - Problem: Multiple residents report same issue
   - Solution: Show recent reports before submitting, or auto-merge duplicates
   - Impact: Reduce manager email overload by 60%

3. **Quick-Action Email Links**
   - Problem: Managers must copy/paste from email to admin panel
   - Solution: Email contains "Add to Current Issues" magic link
   - Impact: 30-second time savings per report

### Medium Priority (Enhance Satisfaction)

4. **Push Notifications for Emergencies**
   - Problem: Residents must remember to check page
   - Solution: Opt-in push notifications for "Down" status changes
   - Impact: Faster resident awareness, fewer "when will this be fixed?" calls

5. **Photo Uploads for Issue Reports**
   - Problem: Text descriptions can be unclear
   - Solution: Allow residents to attach photos to reports
   - Impact: Better issue diagnosis, faster resolution

6. **Issue Status Tracking**
   - Problem: Residents don't know if their report was received
   - Solution: Reference numbers + status page for each report
   - Impact: Increased trust, reduced follow-up calls

### Low Priority (Nice to Have)

7. **Resident Accounts**
   - Problem: Can't track submission history
   - Solution: Optional account creation to see past reports
   - Impact: Better long-term relationship, accountability

8. **Analytics Dashboard**
   - Problem: Managers don't know usage patterns
   - Solution: Dashboard showing page views, reports, most common issues
   - Impact: Data-driven decisions about building improvements

9. **Multi-Language Support**
   - Problem: Non-English speakers may struggle
   - Solution: Spanish/other language toggle
   - Impact: Inclusivity, reduced language barriers

## Success Metrics

### Current Performance (Estimated)

- **Resident Adoption**: ~40% of residents actively use the app
- **Average Status Check Time**: 30 seconds
- **Issue Report Time**: 60 seconds
- **Manager Update Time**: 90 seconds
- **Emergency Response Time**: 15 minutes

### Target Performance (6 Months)

- **Resident Adoption**: 70% of residents actively use the app
- **Average Status Check Time**: 15 seconds (better mobile UX)
- **Issue Report Time**: 45 seconds (better form UX)
- **Manager Update Time**: 60 seconds (mobile edit mode)
- **Emergency Response Time**: 5 minutes (mobile + automation)

## Next Steps

1. **User Research**: Interview 5-10 residents and 2-3 managers to validate pain points
2. **Prioritization**: Rank improvements by impact vs. effort
3. **Prototype**: Build mobile emergency update flow
4. **Test**: A/B test duplicate detection feature
5. **Measure**: Track satisfaction scores monthly
