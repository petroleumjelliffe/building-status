# Building Status - Development Roadmap

## Project Status: ✅ MVP Complete & Deployed

The building status application has been successfully migrated to Next.js with TypeScript and is deployed on Render.com.

---

## ✅ Completed

### Infrastructure
- [x] Next.js 14 App Router with TypeScript strict mode
- [x] PostgreSQL database with Drizzle ORM
- [x] Database migrations and seed scripts
- [x] Session-based authentication with bcrypt
- [x] Deployed to Render.com with auto-deploy
- [x] Static site generation with ISR (60s revalidation)
- [x] Environment variable configuration

### Features
- [x] Real-time system status display (Heat, Water, Laundry)
- [x] Issue tracking and reporting
- [x] Scheduled maintenance display
- [x] Building announcements
- [x] Manager dashboard with live editing

### UX
- [x] Social sharing with Open Graph meta tags
- [x] Mobile responsive design
- [x] Password-protected admin access

---

## 🔍 Phase: Validation

_Ensure the MVP is production-ready and reliable._

### Infrastructure
- [ ] **Redis session storage** - File-based sessions don't persist across Render deployments
  - Set up Redis instance (Upstash free tier)
  - Update auth.ts to use Redis adapter
  - Test session persistence across deployments
- [ ] **Error boundaries** - Add React error boundary components for graceful failure handling
- [ ] **Rate limiting** - Implement rate limiting on API routes to prevent abuse
- [ ] **Request logging** - Add API request/response logging for debugging

### Observability
- [ ] **Error monitoring** - Set up Sentry or similar for error tracking
- [ ] **Uptime monitoring** - External uptime checks and alerting
- [ ] **Basic analytics** - Track page views and sharing metrics

### UX
- [ ] **Copy link button** - Add "Copy Link" with toast notification for easy sharing
- [ ] **Twitter Cards** - Add Twitter Card meta tags for better social previews
- [ ] **Test social sharing** - Validate previews on Facebook, Twitter, iMessage

---

## 🚀 Phase: Optimization

_Improve performance, expand features, and scale._

### Infrastructure
- [ ] **Automated tests** - Jest + React Testing Library for regression prevention
- [ ] **Redis caching layer** - Cache frequently accessed data
- [ ] **Image optimization** - WebP conversion, compression
- [ ] **SEO basics** - sitemap.xml and robots.txt generation

### UX
- [ ] **PWA support**
  - Service worker for offline support
  - "Add to Home Screen" prompt
  - Cache static assets for offline viewing
  - Background sync for form submissions
- [ ] **Print version**
  - Print CSS stylesheet
  - QR code for status page URL
  - Single-page B&W optimized layout
- [ ] **Enhanced OG images** - Dynamic image generation with Vercel/OG

### Features
- [ ] **Enhanced issue tracking**
  - Issue comments/updates
  - Photo upload for issue reports
  - Priority levels
  - Estimated resolution time
- [ ] **Analytics dashboard**
  - Manager dashboard for issue statistics
  - Export issue history to CSV
  - Uptime percentage tracking

### Communication
- [ ] **Push notifications** - Status change alerts (requires service worker)
- [ ] **Email alerts** - Status change notifications
- [ ] **SMS notifications** - Via Twilio for critical alerts
- [ ] **Resident subscriptions** - Opt-in notification preferences

### Expansion
- [ ] **Multi-building support**
  - Per-building status filtering
  - Building-specific announcements
  - Location-based notifications

---

## Success Metrics

### MVP (✅ Achieved)
- [x] Application deployed and accessible
- [x] Manager can update status without touching code
- [x] Page loads in < 2 seconds
- [x] Works on mobile devices
- [x] Social sharing generates proper previews

### Validation Phase Goals
- [ ] Sessions persist across deployments
- [ ] Error monitoring in place
- [ ] 90%+ uptime

### Optimization Phase Goals
- [ ] 60%+ resident adoption
- [ ] < 4 hour average response time to issues
- [ ] Offline support via PWA

---

## Architecture

```
Next.js App Router (TypeScript)
├── Static Generation (ISR - 60s)
├── PostgreSQL Database (Drizzle ORM)
├── Session Auth (File-based → Redis)
└── Render.com Deployment
```

**ADRs:** See [docs/adr/](docs/adr/) for architectural decisions.

---

## Quick Reference

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:studio    # Database GUI
npm run db:setup     # Full database setup
git push origin main # Deploy to Render
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `EDITOR_PASSWORD_HASH` - Admin password (bcrypt)
- `NEXT_PUBLIC_SITE_URL` - Site URL for OG images

---

Last Updated: 2026-01-17
