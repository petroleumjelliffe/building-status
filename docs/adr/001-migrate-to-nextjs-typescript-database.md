# ADR 001: Migrate to Next.js + TypeScript + Database Architecture

## Status

**Proposed** - 2026-01-15

## Context

The current building status page is a static HTML/CSS/JavaScript application with configuration served via Val Town serverless functions. While this approach has served well for the MVP, we've identified several limitations:

### Current Architecture Limitations

1. **No Live Editing**: Managers must edit Val Town config directly, requiring technical knowledge
2. **Client-Side Only**: All rendering happens in browser, no SEO benefits, slower initial load
3. **No Type Safety**: Vanilla JavaScript increases likelihood of runtime errors
4. **Limited Interactivity**: No simple way to add authenticated editing features
5. **Scalability**: As features grow, single HTML file becomes unwieldy
6. **No Build Process**: Manual CSS/JS management, no optimization pipeline

### Requirements for Next Phase

1. **Manager Edit Mode**: Simple tap-to-cycle status updates without coding
2. **Type Safety**: Reduce bugs with TypeScript across the application
3. **Server-Side Rendering**: Faster initial loads, better SEO
4. **Database-Backed**: Enable real-time editing with proper data persistence
5. **Modern Tooling**: Better DX with build tools, hot reload, linting

### User Research

Via AskUserQuestion (2026-01-15):
- Framework preference: Next.js (React-based SSR)
- Storage: Database (Postgres)
- Hosting: Render (free tier + managed Postgres)
- Authentication: Static password (simple, sufficient for single manager)

## Decision

We will migrate the building status application to a modern stack:

### Technology Stack

**Frontend Framework**
- **Next.js 15 (App Router)** with TypeScript
- Server-side rendering by default
- Built-in API routes for backend
- File-based routing
- Built-in optimization (images, fonts, code splitting)

**Database**
- **PostgreSQL** via Render Managed Database
- **Drizzle ORM** for type-safe queries
- Schema: `system_status`, `issues`, `maintenance`, `announcements`, `config` tables
- Migrations managed via Drizzle Kit

**Hosting**
- **Render** web service (free tier)
- Automatic HTTPS, deployments, environment variables
- Managed Postgres included

**Authentication**
- Static password (bcrypt hashed in environment variable)
- Session-based edit mode toggle
- No OAuth complexity needed for single manager

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App (Render)              │
├─────────────────────────────────────────────────────┤
│  Server Side (SSR + API Routes)                     │
│  ├─ /app/page.tsx - Main status page (SSR)         │
│  ├─ /app/api/status/route.ts - Get status          │
│  ├─ /app/api/status/update/route.ts - Update       │
│  └─ /app/api/auth/route.ts - Password check        │
├─────────────────────────────────────────────────────┤
│  Client Components (Interactive)                    │
│  ├─ StatusPill - Tap to cycle: ok → issue → down   │
│  ├─ AnnouncementBanner - Edit message + severity   │
│  └─ EditModeToggle - Password prompt               │
├─────────────────────────────────────────────────────┤
│  Database (Postgres via Render)                     │
│  └─ system_status, issues, maintenance, etc.       │
└─────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// Core tables
- system_status: Current status of heat/water/laundry
- issues: Reported building issues
- maintenance: Scheduled maintenance events
- announcements: Pinned notifications with expiration
- config: Static configuration (contacts, links, schedules)
```

See full schema in migration plan.

### Tap-to-Edit Experience

**Manager Flow:**
1. Click "Edit" button in header
2. Enter password (prompt modal)
3. Edit mode activates (visual indicator)
4. Tap system status pills to cycle: ok → issue → down → ok
5. Click announcement to edit text inline
6. Tap severity badge to cycle: warning → info → alert
7. Changes save automatically via API

**Technical Implementation:**
- Client components for interactive editing
- Optimistic UI updates (immediate feedback)
- API routes handle database mutations
- On-demand revalidation triggers SSR cache refresh

### Caching Strategy

1. **Next.js Data Cache**: 60s revalidation on status page
2. **On-Demand Revalidation**: Triggered on status updates
3. **Render CDN**: Edge caching for static assets
4. **HTTP Headers**: Standard browser caching

### Migration Approach

**Branching Strategy:**
- Keep `main` branch unchanged (current static site works)
- Create `next-ts-migration` branch for new architecture
- Can run both simultaneously during transition
- Merge to main when stable and tested

**Deployment:**
- Render web service for Next.js app
- Render managed Postgres for database
- Environment variables for secrets
- Automatic deployments on git push

## Consequences

### Positive

1. **Type Safety**: TypeScript prevents entire classes of bugs
2. **Better DX**: Hot reload, IntelliSense, modern tooling
3. **Live Editing**: Managers can update status without technical knowledge
4. **Performance**: SSR reduces time-to-first-paint
5. **Scalability**: Component architecture supports feature growth
6. **Maintainability**: Clear separation of concerns
7. **Testability**: Components easier to unit test
8. **SEO**: Server-rendered HTML improves search indexing

### Negative

1. **Complexity**: More moving parts than static HTML
2. **Hosting Cost**: $0-7/month (vs free static hosting)
3. **Server Required**: Can't deploy to GitHub Pages anymore
4. **Migration Effort**: Significant rewrite (estimate: 2-3 days)
5. **Learning Curve**: Team needs Next.js/TypeScript knowledge
6. **Database Dependency**: Requires Postgres instance

### Neutral

1. **Visual Design**: Preserved (CSS migrated as-is)
2. **Feature Parity**: All current features maintained
3. **User Experience**: Same for residents, enhanced for managers

## Alternatives Considered

### Alternative 1: Astro + TypeScript

**Pros:**
- Lightweight, minimal JavaScript
- Great for content-heavy sites
- Fast build times

**Cons:**
- Less ecosystem support than Next.js/React
- Fewer examples for complex interactivity
- Team less familiar with Astro

**Verdict:** ❌ Rejected - Next.js better ecosystem and team familiarity

### Alternative 2: SvelteKit + TypeScript

**Pros:**
- Excellent DX
- Smaller bundle sizes
- Fast runtime performance

**Cons:**
- Smaller ecosystem than React
- Less TypeScript tooling maturity
- Team learning curve

**Verdict:** ❌ Rejected - Next.js more mature and better documented

### Alternative 3: Keep Static HTML + Add Edit Mode Client-Side

**Pros:**
- Minimal migration effort
- Keep simple deployment

**Cons:**
- No SSR benefits
- Client-side auth is insecure
- No type safety
- Limited scalability

**Verdict:** ❌ Rejected - Doesn't solve core problems

### Alternative 4: Environment Variables Instead of Database

**Pros:**
- Simpler than database
- No DB hosting cost

**Cons:**
- Requires redeployment for config changes
- No version history
- Can't enable live editing without rebuild

**Verdict:** ❌ Rejected - Defeats purpose of live editing

### Alternative 5: Firebase/Supabase Instead of Postgres

**Pros:**
- Firebase: Real-time updates out of box
- Supabase: Great DX, instant APIs

**Cons:**
- Another vendor to manage
- Render offers integrated Postgres
- Overkill for simple use case

**Verdict:** ❌ Rejected - Keep stack simple with Render-managed Postgres

## Implementation Plan

### Phase 1: Setup (Day 1, Morning)
- Create `next-ts-migration` branch
- Initialize Next.js with TypeScript
- Set up Render Postgres database
- Configure Drizzle ORM
- Create and run migrations

### Phase 2: Data Migration (Day 1, Afternoon)
- Migrate CSS from HTML to globals.css
- Define TypeScript types
- Seed database from current config.json
- Build query utilities

### Phase 3: API Layer (Day 2, Morning)
- Implement API routes:
  - GET /api/status
  - POST /api/status/update
  - POST /api/auth
  - POST /api/announcements
- Add error handling
- Test with Postman/curl

### Phase 4: Components (Day 2, Afternoon)
- Build StatusPill with tap-to-cycle
- Build AnnouncementBanner with inline edit
- Port other components (IssueCard, etc.)
- Implement ShareButton
- Create EditModeToggle

### Phase 5: SSR Page (Day 3, Morning)
- Build main page.tsx with SSR
- Configure revalidation
- Wire up components
- Add Open Graph meta tags

### Phase 6: Testing & Deploy (Day 3, Afternoon)
- Local testing (all features)
- Deploy to Render staging
- Production testing
- DNS configuration (if needed)
- Documentation updates

## Verification Checklist

### Functional Testing
- [ ] Page loads with SSR (view source shows data)
- [ ] Edit mode activates with password
- [ ] Status pills cycle: ok → issue → down → ok
- [ ] Announcement editing works
- [ ] Severity cycling works
- [ ] Share button functions on mobile
- [ ] All sections render correctly
- [ ] Auto-expiring announcements work

### Performance Testing
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] Database queries < 50ms
- [ ] Cache hit rate > 90%

### Security Testing
- [ ] Password hashing verified
- [ ] API routes require auth for mutations
- [ ] Environment variables not exposed
- [ ] SQL injection protection (Drizzle ORM)

## Cost Analysis

### Current Setup (Static + Val Town)
- **Hosting**: Free (GitHub Pages or Netlify)
- **Config Server**: Free (Val Town)
- **Total**: $0/month

### New Setup (Next.js + Postgres)

**Option 1: Render (Chosen)**
- Web Service: Free (512MB RAM, sufficient)
- Postgres: Free for 90 days, then $7/month
- **Total**: $0/month (first 90 days), $7/month after

**Option 2: Render + Neon (Free Forever)**
- Web Service: Free (Render)
- Postgres: Free forever (Neon - 3GB limit)
- **Total**: $0/month forever

**Recommendation**: Start with Render Postgres (integrated), migrate to Neon if cost becomes concern.

## Rollback Strategy

If migration fails or critical issues arise:

1. **Keep main branch unchanged** - Current site continues working
2. **Separate branch** - Migration isolated on `next-ts-migration`
3. **Dual deployment** - Can run both simultaneously
4. **Incremental rollout** - Test with subset of users first
5. **Data export** - Can export from Postgres back to JSON if needed

No risk to production site during migration.

## Success Metrics

Post-migration (after 30 days):

1. **Manager Satisfaction**
   - Target: 5-minute status update (vs 10+ minutes editing Val Town)
   - Target: Zero technical support requests for updates

2. **Performance**
   - Target: Lighthouse score > 90
   - Target: 50% reduction in Time to Interactive

3. **Reliability**
   - Target: 99.9% uptime (Render SLA)
   - Target: Zero data loss incidents

4. **Developer Experience**
   - Target: 50% reduction in bug reports (TypeScript safety)
   - Target: 2x faster feature development (component architecture)

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Render Documentation](https://render.com/docs)
- [Current SPEC.md](../SPEC.md)
- [Current MVP-ROADMAP.md](../MVP-ROADMAP.md)

## Related ADRs

- None (first ADR)

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-15 | Claude + Pete | Initial proposal |
