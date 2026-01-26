# Building Status App - Initial Rollout Strategy

## Overview

This document outlines the success criteria, measurement plan, and evaluation strategy for the initial rollout of the Building Status app to your building.

**Timeline**: 90-day evaluation period
**Primary Goals**: Measure adoption and satisfaction
**Building Context**: 40 units (~80 residents, assuming 2 adults per unit)

---

## Success Criteria Framework

### 1. Adoption Metrics

**Traffic Sources**
- QR code scans → visits
- WhatsApp shares → visits
- Direct/bookmark visits
- Other sources (email, social)

**Resident Feature Adoption**
- Issues reported via email
- Calendar subscriptions/downloads
- Helpful links clicked
- Contact info accessed

**Manager Feature Adoption**
- System status updates
- Issues added/resolved
- Events posted
- Share button usage

### 2. Satisfaction Metrics

**Quantitative**
- Short survey ratings (1-5 scale)
- Net Promoter Score (NPS)
- Feature satisfaction scores

**Qualitative**
- In-person interview insights
- Written feedback
- Observed behavior patterns

---

## Detailed Success Metrics

### Phase 1: Launch Week (Days 1-7)

#### Adoption Goals

| Metric | Target | Actual Number | How to Measure |
|--------|--------|---------------|----------------|
| **Initial QR code scans** | 30% of units | ~12 units (24 people) | Analytics: UTM parameter `?utm_source=qr` |
| **Page bookmarked** | 20% of units | ~8 units (16 people) | Estimated from repeat visitor rate |
| **WhatsApp shares** | 5+ residents share | 5-10 people | Analytics: Referrer from `wa.me` or UTM `?utm_source=whatsapp` |
| **First issue reports** | 2-3 reports | 2-3 reports | Email count to manager |

#### Manager Success

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Property setup complete** | 100% | Systems configured, contacts added, events posted |
| **First status update** | Within 48 hours | Edit mode usage log |
| **QR codes distributed** | 100% of units | Delivery confirmation |

#### Week 1 Survey (Quick Pulse)

**Sent to**: All residents who visited the page
**Questions** (5-point scale: Strongly Disagree to Strongly Agree):

1. "The status page was easy to access"
2. "I found the information I needed quickly"
3. "I plan to use this regularly"

**Open question**: "What would make this more useful to you?"

---

### Phase 2: Steady State (Days 8-30)

#### Adoption Goals

| Metric | Minimum Success | Good Success | Great Success |
|--------|-----------------|--------------|---------------|
| **Total unique visitors** | 40% (16 units, ~32 people) | 60% (24 units, ~48 people) | 75% (30 units, ~60 people) |
| **Weekly active users** | 15% (6 units, ~12 people) | 25% (10 units, ~20 people) | 40% (16 units, ~32 people) |
| **Return visitor rate** | 30% | 50% | 70% |
| **Avg session duration** | 45 sec | 90 sec | 2+ min |

#### Traffic Source Breakdown

| Source | Target Mix | What It Means |
|--------|------------|---------------|
| **QR code (first visit)** | 40-50% | Good initial distribution |
| **WhatsApp referral** | 20-30% | Organic sharing happening |
| **Direct/bookmark** | 20-30% | Residents are returning |
| **Other** | 10-20% | Natural discovery |

#### Feature Adoption Goals

| Feature | Minimum | Good | Great |
|---------|---------|------|-------|
| **Calendar subscriptions** | 10% of visitors | 20% | 30%+ |
| **Issues reported** | 3 in 30 days | 5-8 | 10+ |
| **Helpful link clicks** | 5% of sessions | 15% | 25%+ |
| **Contact clicks** | 10% of sessions | 20% | 30%+ |

#### Manager Activity Goals

| Activity | Target Frequency |
|----------|------------------|
| **System status updates** | 2-3x per week minimum |
| **Issue responses** | Within 24 hours of report |
| **Events posted** | 1-2 per week |
| **Share button usage** | After major updates |

---

### Phase 3: Evaluation (Days 31-90)

#### Long-term Adoption

| Metric | Target | Actual Number |
|--------|--------|---------------|
| **Monthly active users** | 50%+ of units | 20+ units (~40 people) |
| **Avg visits per active user** | 3+ per month | 60+ total monthly visits |
| **Calendar subscribers retained** | 80%+ of initial | If 8 subscribed, keep 6+ |
| **Issue reports trending** | Increasing or stable | 5-10 per month sustained |

#### Manager Efficiency

| Metric | Target |
|--------|--------|
| **Time to update status** | < 2 minutes |
| **Issue response time** | < 12 hours (business hours) |
| **Resident follow-up calls** | Reduced by 50% vs. baseline |
| **Manager satisfaction** | 4+ out of 5 |

---

## Implementation: How to Track

### Analytics Setup

**Recommended Tool**: Google Analytics 4 (free, privacy-friendly)

**Key Events to Track**:
```javascript
// Page view with source
gtag('event', 'page_view', {
  'source': 'qr|whatsapp|direct|other'
});

// Calendar subscription
gtag('event', 'calendar_subscribe', {
  'method': 'download|webcal'
});

// Contact interaction
gtag('event', 'contact_click', {
  'contact_type': 'phone|email'
});

// Helpful link click
gtag('event', 'helpful_link_click', {
  'link_title': 'WhatsApp Group|Bike Reg|etc'
});

// Share action
gtag('event', 'share', {
  'method': 'native_share|clipboard'
});
```

**UTM Parameter Strategy**:
- QR codes: `?utm_source=qr&utm_medium=physical&utm_campaign=rollout`
- WhatsApp: `?utm_source=whatsapp&utm_medium=social&utm_campaign=organic`
- Manager shares: `?utm_source=manager&utm_medium=share&utm_campaign=update`

### Issue Report Tracking

**Manager Dashboard** (Simple Spreadsheet):

| Date | Unit | Category | Response Time | Status | Satisfaction |
|------|------|----------|---------------|--------|--------------|
| 1/26 | 4A | Heat | 2 hours | Resolved | 5/5 |
| 1/27 | 2B | Laundry | 24 hours | Investigating | - |

**Metrics to Calculate**:
- Total reports per week
- Average response time
- Resolution rate
- Satisfaction from follow-up

### Manager Activity Log

Track in simple spreadsheet or notebook:

| Date | Action | Time Spent | Notes |
|------|--------|------------|-------|
| 1/26 | Updated water status | 1 min | Quick toggle |
| 1/27 | Posted snow event | 3 min | Added description |
| 1/28 | Resolved issue | 2 min | Marked complete |

---

## Resident Survey & Interviews

### 30-Day Survey

**Timing**: End of Phase 2 (Day 30)
**Delivery**: Link posted on status page + email to residents who reported issues
**Expected Response Rate**: 20-30% of active users

#### Survey Questions

**Section 1: Usage** (Multiple Choice)

1. How often do you check the building status page?
   - [ ] Daily
   - [ ] 2-3 times per week
   - [ ] Weekly
   - [ ] Only when there's a problem
   - [ ] Rarely/Never

2. How did you first learn about the status page?
   - [ ] QR code in welcome packet
   - [ ] QR code in building lobby
   - [ ] WhatsApp/text from neighbor
   - [ ] Email from building management
   - [ ] Other: _______

3. Which features have you used? (Check all that apply)
   - [ ] Checked system status (heat, water, laundry)
   - [ ] Viewed current issues
   - [ ] Checked upcoming events
   - [ ] Downloaded/subscribed to calendar
   - [ ] Reported an issue
   - [ ] Clicked on helpful links
   - [ ] Used contact information
   - [ ] Shared with neighbors

**Section 2: Satisfaction** (1-5 Scale: Very Dissatisfied to Very Satisfied)

4. How satisfied are you with the building status page overall?
5. How satisfied are you with the speed of status updates?
6. How satisfied are you with the information provided?
7. How satisfied are you with the ease of use?

**Section 3: Net Promoter Score**

8. How likely are you to recommend this status page to a neighbor? (0-10)
   - 0 = Not at all likely
   - 10 = Extremely likely

**Section 4: Feedback** (Open Text)

9. What do you like most about the status page?
10. What could be improved?
11. What features would you like to see added?

**Section 5: Impact** (Multiple Choice)

12. Since the status page launched, have you...
    - [ ] Called/emailed management less often
    - [ ] Felt more informed about building issues
    - [ ] Shared updates with neighbors more often
    - [ ] Found it easier to plan around maintenance
    - [ ] No change in behavior

### In-Person Interviews

**Target**: 8-12 residents representing diverse demographics
- Mix of frequent users and non-users
- Different age groups
- Tech-savvy and less tech-savvy
- Long-term and new residents

**Recruitment**:
- Offer $10-15 gift card for 10-minute conversation
- Catch residents in lobby/elevator
- Schedule brief coffee chats

#### Interview Script

**Introduction** (1 min)
"Hi, I'm [Name] from building management. We launched a new building status page a month ago and I'd love to hear your thoughts. This will take about 10 minutes. [Offer incentive]."

**Discovery Questions** (5-7 min)

1. **Awareness**: "Have you heard about the building status page?"
   - If no: "How do you usually find out about building issues or maintenance?"
   - If yes: Continue below

2. **First Impression**: "How did you first find out about it?"
   - Follow-up: "What did you think when you first saw it?"

3. **Usage**: "How often do you check it?"
   - If never: "What would make you check it?"
   - If sometimes: "What triggers you to check it?"
   - If often: "What keeps you coming back?"

4. **Value**: "Can you think of a time when the status page was helpful?"
   - Probe for specific examples
   - Ask about what information mattered most

5. **Problems**: "Have you run into any issues using it?"
   - Technical problems
   - Missing information
   - Confusing features

6. **Comparison**: "How does this compare to how you got building info before?"
   - Better/worse/same?
   - What changed for you?

7. **Feature Awareness**: "Did you know you can...
   - ...subscribe to the calendar to get event reminders?"
   - ...see which systems are working before reporting an issue?"
   - [If no: gauge interest]

8. **Sharing**: "Have you shared the page with neighbors or guests?"
   - If yes: "How? What did you say about it?"
   - If no: "Would you? Why or why not?"

**Wish List** (2 min)

9. "If you could add one thing to make this more useful, what would it be?"
   - Probe for specifics
   - Ask about priority

**Closing** (1 min)

10. "On a scale of 1-5, how valuable is this status page to you as a resident?"
    - Ask them to explain their rating

"Thank you! This feedback is really helpful. Here's your [gift card]."

---

## Success Thresholds

### Minimum Viable Success (MVP)

After 90 days, the rollout is successful if:

**Adoption**
- ✅ 40%+ of units have visited at least once (16+ units, ~32 people)
- ✅ 20%+ are monthly active users (8+ units, ~16 people)
- ✅ 5+ issues reported (shows residents trust it)
- ✅ 10%+ calendar subscription rate (4+ subscribers)

**Satisfaction**
- ✅ Average satisfaction: 3.5/5 or higher
- ✅ NPS: 0 or positive (more promoters than detractors)
- ✅ Manager satisfaction: 4/5 or higher
- ✅ 50%+ of residents find it "very helpful" or "helpful"

**Manager Efficiency**
- ✅ Manager can update status in < 3 minutes
- ✅ Issue reports are responded to within 24 hours
- ✅ Manager uses it 3+ times per week

### Strong Success

- ✅ 60%+ of units visited (24+ units, ~48 people)
- ✅ 30%+ monthly active users (12+ units, ~24 people)
- ✅ Average satisfaction: 4.2/5
- ✅ NPS: +30 or higher
- ✅ 20%+ calendar subscription rate (8+ subscribers)
- ✅ Resident interviews reveal specific behavior changes

### Exceptional Success

- ✅ 75%+ of units visited (30+ units, ~60 people)
- ✅ 50%+ monthly active users (20+ units, ~40 people)
- ✅ Average satisfaction: 4.5/5
- ✅ NPS: +50 or higher
- ✅ Residents proactively sharing with neighbors
- ✅ Reduced management calls by 60%+
- ✅ Residents request additional features (shows engagement)

---

## Decision Framework

### After 30 Days: Checkpoint

**If adoption is low (< 20% of units / < 8 units)**:
- Action: Increase awareness
  - Post new QR codes in more visible locations
  - Manager shares in WhatsApp group
  - Mention in next building-wide communication
  - Offer "status page tour" at next building meeting

**If satisfaction is low (< 3.0/5)**:
- Action: Identify and fix issues
  - Review survey comments for patterns
  - Conduct 3-5 in-person interviews immediately
  - Prioritize quick wins (fix broken features)
  - Communicate improvements to residents

**If manager isn't using it regularly (< 2x/week)**:
- Action: Reduce friction
  - Simplify edit mode
  - Create manager quick-start guide
  - Offer training session
  - Identify blockers

### After 90 Days: Go/No-Go Decision

**Scenario A: Strong Success**
- **Decision**: Full rollout, expand features
- **Next Steps**:
  - Plan Phase 2 features based on feedback
  - Consider expanding to other properties
  - Invest in improvements (push notifications, etc.)

**Scenario B: Minimum Viable Success**
- **Decision**: Continue with optimizations
- **Next Steps**:
  - Focus on increasing engagement
  - Improve most-requested features
  - Re-evaluate after another 90 days

**Scenario C: Below Minimum Success**
- **Decision**: Major pivot or sunset
- **Next Steps**:
  - Determine root cause (awareness? usability? value?)
  - Consider major redesign if fixable
  - Or deprecate if fundamentally not working

---

## Rollout Communications Plan

### Week -1: Pre-Launch Teaser

**Channel**: Email + WhatsApp group
**Message**: "Coming soon: A new way to check building status, report issues, and stay informed. Watch for a QR code in your mailbox next week!"

### Day 1: Official Launch

**Channel**: Physical QR code card in all mailboxes
**Card Content**:
```
📱 NEW: Building Status Page

Check systems • Report issues • View events

[QR CODE]

Or visit: [URL]

Questions? Email [manager email]
```

**Additional**: Post QR code poster in lobby

### Day 1: Digital Announcement

**Channel**: Email + WhatsApp
**Message**:
"The new Building Status Page is live! 🎉

✅ Check heat, water, laundry status in real-time
📝 Report issues instantly
📅 Subscribe to building events
🔗 Access helpful links & contacts

Scan the QR code from your mailbox or visit: [URL]

Bookmark it for quick access!"

### Week 1: Usage Reminder

**Channel**: WhatsApp (if culturally appropriate)
**Message**: "Reminder: Use the status page to check if issues are already reported before calling/emailing. It saves everyone time! [URL]"

### Week 2: Feature Highlight

**Channel**: Email
**Message**: "💡 Tip: Subscribe to our building calendar!

You can add building events (maintenance, trash days, etc.) directly to your phone's calendar. Just visit [URL] and tap '📅 Subscribe' under Upcoming Events."

### Week 4: Feedback Request

**Channel**: Email
**Message**: "We'd love your feedback on the new status page!

Take our 2-minute survey: [Survey Link]

Your input helps us make it better. Thanks!"

### Day 30, 60, 90: Success Stories

**Channel**: Email or lobby poster
**Message Examples**:
- "Thanks to the status page, we resolved [Issue] in [Time] - faster than ever!"
- "[X]% of residents are now using the calendar subscription to stay informed"
- "This month, [Y] residents reported issues via the page, helping us respond faster"

---

## Budget & Resources

### Time Investment

**Manager**:
- Initial setup: 2 hours
- Weekly updates: 30 minutes
- Issue responses: 15 min per report
- Monthly review: 1 hour

**Resident**:
- First visit: 2-3 minutes
- Return visits: 30 seconds
- Issue reporting: 1 minute
- Calendar setup: 2 minutes (one-time)

### Financial Investment

**Required**:
- QR code printing: $20-50 (business cards or posters)
- Survey tool: Free (Google Forms) or $10/month (Typeform)
- Analytics: Free (Google Analytics 4)

**Optional**:
- Interview incentives: $100-180 (10 people × $10-15)
- Professional QR code cards: $100
- Premium analytics: $50-200/month

**Total estimated**: $120-430 for 90-day rollout

---

## Templates & Resources

### QR Code Card Template

**Front**:
```
━━━━━━━━━━━━━━━━━━━━
   BUILDING STATUS
   [Building Name/Address]
━━━━━━━━━━━━━━━━━━━━

[Large QR Code]

Scan to access:
✓ System status
✓ Issue reporting
✓ Event calendar
✓ Important contacts
━━━━━━━━━━━━━━━━━━━━
```

**Back**:
```
━━━━━━━━━━━━━━━━━━━━
HOW TO USE:

1. Scan QR code with camera
2. Bookmark the page
3. Check anytime for updates

Or visit: [URL]

Need help?
Email: [manager@email.com]
━━━━━━━━━━━━━━━━━━━━
```

### Manager Weekly Checklist

**Monday**:
- [ ] Update system status (30 sec)
- [ ] Post upcoming week's events (2 min)
- [ ] Review any weekend issue reports (5 min)

**Wednesday**:
- [ ] Check for new issues (2 min)
- [ ] Update status if anything changed (1 min)

**Friday**:
- [ ] Verify weekend coverage plan (1 min)
- [ ] Post any weekend maintenance (2 min)
- [ ] Review week's analytics (5 min)

---

## Next Steps

### Immediate (Before Launch)

1. [ ] Set up Google Analytics with event tracking
2. [ ] Add UTM parameters to QR code URLs
3. [ ] Create QR code cards and print
4. [ ] Create pre-launch email/WhatsApp message
5. [ ] Set up issue report tracking spreadsheet
6. [ ] Create manager activity log template

### Week 1

7. [ ] Distribute QR codes to all units
8. [ ] Send digital announcement
9. [ ] Monitor analytics daily
10. [ ] Respond to any initial questions

### Week 2-4

11. [ ] Send feature highlight message
12. [ ] Review Week 1 analytics
13. [ ] Identify any quick-win improvements

### Day 30

14. [ ] Send 30-day survey
15. [ ] Review adoption metrics vs. targets
16. [ ] Begin in-person interviews
17. [ ] Make checkpoint decision

### Day 60

18. [ ] Check progress on improvements
19. [ ] Review sustained usage metrics
20. [ ] Plan for Day 90 evaluation

### Day 90

21. [ ] Complete all interviews
22. [ ] Analyze full dataset
23. [ ] Make go/no-go decision
24. [ ] Plan next phase if successful

---

## Appendix: Sample Analytics Dashboard

**Weekly Snapshot**:
```
Week of [Date]

TRAFFIC
- Total visitors: [X] ([Y]% of units)
- New visitors: [X]
- Returning: [X]
- Sources:
  - QR: [X]%
  - WhatsApp: [X]%
  - Direct: [X]%

ENGAGEMENT
- Avg session: [X] sec
- Calendar subs: [X]
- Contact clicks: [X]
- Link clicks: [X]

RESIDENT ACTIONS
- Issues reported: [X]
- Total this month: [X]

MANAGER ACTIONS
- Status updates: [X]
- Events posted: [X]
- Issues resolved: [X]
```

---

## Questions to Answer

Before rollout, confirm:

1. ✅ **Building size**: 40 units (~80 residents)
2. **Manager availability**: Can manager check page 3+ times/week?
3. **Communication channels**: Do all residents have email? WhatsApp group?
4. **Existing pain points**: What problems are we trying to solve?
5. **Comparison baseline**: How are things done now?
6. **Success ownership**: Who reviews metrics weekly?
7. **Budget approval**: Can we spend $120-430 on this rollout?
8. **Timeline**: Are we ready to launch in [Date]?

---

*Last Updated: January 26, 2025*
