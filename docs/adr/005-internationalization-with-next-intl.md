# ADR 005: Internationalization with next-intl

## Status
Proposed

## Context

Co-ops are multicultural communities. Residents who don't speak English — or don't speak it as a first language — need to use the building status page to check systems, report issues, view events, and access emergency contacts.

### Current State

- ~170+ hardcoded English strings scattered across ~20 client components and 5 server-rendered pages
- No i18n library, middleware, translation files, or locale detection
- Root layout hardcodes `lang="en"`
- Date formatting hardcodes `'en-US'` in 14 call sites across the codebase
- No constants file for UI strings — all inline in JSX

### Requirements

1. Residents must be able to view the entire UI in their preferred language
2. Language switching must be easy and persist across sessions
3. Existing QR codes, bookmarks, and shared links must not break
4. Print pages (lobby posters, unit cards, maintenance signs) must also translate
5. User-generated content (issue descriptions, event titles, announcements) is NOT translated — admins enter it in whatever language they choose
6. Date/time formatting should respect the user's locale

## Decision

Use **next-intl** (v3+) with **cookie-based locale routing** (no URL prefix) supporting **English, Spanish, and Simplified Chinese**.

### Why next-intl

- Purpose-built for Next.js 14 App Router with first-class server and client component support
- `useTranslations()` hook for client components, `getTranslations()` for server components
- ~2KB client bundle, ICU message format, JSON translation files
- `localePrefix: 'never'` option supports cookie-only routing out of the box

### Why Cookie-Based Routing (No URL Change)

The existing route structure is `/{hash}` where `hash` identifies a property. These URLs are:
- Printed on **physical QR code signs** posted in buildings (cannot be updated)
- Bookmarked by residents
- Shared via SMS and social media

Adding a locale prefix (`/es/{hash}`) would break every existing link. Instead:
- Store locale in a `NEXT_LOCALE` cookie set by the language switcher
- Middleware reads the cookie (or `Accept-Language` header as fallback) and provides the locale internally
- **Fallback chain**: Cookie → `Accept-Language` header → `'en'`

### Why These Languages

| Locale | Rationale |
|--------|-----------|
| **en** (English) | Default, current language |
| **es** (Spanish) | Largest non-English language in North American urban areas |
| **zh** (Simplified Chinese) | Significant population in many urban co-ops |

Additional languages can be added later by creating a new `messages/{locale}.json` file and adding the locale code to the config array.

### Implementation Phases

#### Phase 0: Foundation

Install `next-intl` and create scaffolding. No visible behavior change — app continues working in English.

**New files:**
- `messages/en.json` — all ~170 extracted strings organized by namespace (`common`, `issues`, `events`, `contacts`, `garbage`, `links`, `calendar`, `auth`, `settings`, `qr`, `print`, `footer`, `landing`, `meta`)
- `messages/es.json`, `messages/zh.json` — copies of `en.json` (placeholder for real translations)
- `src/i18n/config.ts` — locale list, `Locale` type, default locale
- `src/i18n/request.ts` — `getRequestConfig()` implementing the cookie → Accept-Language → default fallback chain
- `src/middleware.ts` — next-intl middleware with `localePrefix: 'never'`

**Modified files:**
- `package.json` — add `next-intl`
- `next.config.js` — wrap config with `createNextIntlPlugin`
- `src/app/layout.tsx` — wrap children in `NextIntlClientProvider`, change `lang="en"` to dynamic `lang={locale}`

**Font note:** Add `latin-ext` subset to DM Sans/Inter for Spanish accented characters. CJK glyphs fall back to system fonts (included on all major OSes).

#### Phase 1: Client Component String Extraction

Replace hardcoded strings in all `'use client'` components with `useTranslations()` calls. English behavior remains identical.

**Components (~20 files):**
- `StatusPageClient.tsx` (~25 strings — section titles, buttons, footer)
- `LoginModal.tsx`, `HamburgerMenu.tsx`, `EditToggle.tsx`, `ShareButton.tsx`
- `IssueForm.tsx`, `IssueCard.tsx`, `EventForm.tsx`, `EventCard.tsx`
- `ContactForm.tsx`, `ContactCard.tsx`, `AnnouncementBanner.tsx`
- `GarbageSchedule.tsx`, `GarbageScheduleForm.tsx`
- `HelpfulLinks.tsx`, `HelpfulLinkForm.tsx`
- `CalendarSubscribe.tsx`, `SettingsForm.tsx`, `QRCodeManager.tsx`

#### Phase 2: Locale-Aware Date/Time Formatting

Replace 14 hardcoded `'en-US'` date formatting calls with the user's locale.

**New file:** `src/lib/date-format.ts` — `useFormatDate()` hook using `useLocale()` from next-intl

**Files to update:**
- `src/app/[hash]/page.tsx` — server-side formatting via `getLocale()`
- `src/components/EventCard.tsx` (4 calls), `IssueCard.tsx` (2), `QRCodeManager.tsx` (2)
- All 3 print pages (5+ calls), including the hardcoded English day abbreviation map

#### Phase 3: Server Components & Print Pages

Translate server-rendered strings using `getTranslations()` from `next-intl/server`.

- `src/app/page.tsx` — 3 landing page strings
- `src/app/[hash]/page.tsx` — metadata strings
- `src/app/print/property-sign/[hash]/page.tsx` (~20 strings)
- `src/app/print/unit-cards/[hash]/page.tsx` (~8 strings)
- `src/app/print/maintenance-sign/[hash]/page.tsx` (~25 strings)

Print pages with their own `<html lang="en">` tags must also use the dynamic locale.

#### Phase 4: Language Switcher UI

**New file:** `src/components/LanguageSwitcher.tsx` — displays names in native script (English, Español, 中文), sets `NEXT_LOCALE` cookie, calls `router.refresh()`

**Integration:**
- `HamburgerMenu.tsx` — add switcher below Login/Logout
- Print pages — add to print controls bar (hidden via `@media print`)

#### Phase 5: Real Translations

Produce actual Spanish and Chinese translations for `es.json` and `zh.json`. Options:
- AI-assisted first draft + human review from bilingual co-op members
- Professional translation service
- Community contribution

**UI length note:** Spanish runs ~30% longer than English — verify buttons and print layouts don't break.

#### Phase 6: Testing Updates

**New file:** `src/test/intl-wrapper.tsx` — utility wrapping components in `NextIntlClientProvider`

- Update all existing component tests to use the intl wrapper
- Add locale-switching smoke tests
- Verify `npm test` and `npm run build` pass at every phase

## Consequences

### Positive

- Residents can use the app in their preferred language without any technical knowledge
- Cookie-based routing preserves all existing QR codes, bookmarks, and shared links
- Adding new languages requires only a new JSON file and a one-line config change
- Date/time formatting automatically adapts to locale conventions
- ~2KB client bundle addition (minimal performance impact)
- Type-safe translation keys via TypeScript

### Negative

- ~170 string extractions across ~20 files — significant initial refactoring effort
- All existing component tests need wrapping with the intl provider
- Translation maintenance burden — every new UI string needs entries in all locale files
- Missing translations silently fall back to English (could go unnoticed)
- Chinese text requires system font fallback since DM Sans lacks CJK glyphs (acceptable — system fonts render well)
- `confirm()` and `alert()` dialog chrome stays in the browser's language (only the message text is translated)

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Translation key typos cause runtime errors | next-intl falls back to English for missing keys; enable dev warnings |
| Print page layout breaks with longer Spanish text | Test print preview in each language before shipping |
| Middleware adds latency | Cookie read is ~0ms; no DB queries in the middleware |
| Future RTL language support (Arabic, Hebrew) | Out of scope — would need `dir="rtl"` and CSS adjustments; defer until demand |

## Alternatives Considered

### 1. URL Prefix Routing (`/es/[hash]`)
- Standard i18n approach with locale in the URL path
- **Rejected**: Breaks every existing QR code printed on physical signs in buildings. These cannot be reprinted or redirected without significant coordination.

### 2. react-intl (FormatJS)
- Mature library with ICU message format support
- **Rejected**: Heavier client bundle, weaker Next.js App Router integration, more boilerplate for server components

### 3. i18next / next-i18next
- Popular general-purpose i18n framework
- **Rejected**: `next-i18next` does not support App Router; raw `i18next` requires significant custom plumbing for server components

### 4. Subdomain-Based Routing (`es.building.example.com`)
- Clean URL separation by language
- **Rejected**: Requires DNS configuration per locale, SSL certificates, and would break existing QR codes

### 5. Translate User-Generated Content
- Store translations of issue descriptions, event titles, etc. in the database
- **Rejected**: Over-engineering for this use case. Admins write content once in the language their residents understand. The scope here is UI chrome only.

## References

- next-intl documentation: https://next-intl.dev
- Next.js Internationalization: https://nextjs.org/docs/app/building-your-application/routing/internationalization
- ICU Message Format: https://unicode-org.github.io/icu/userguide/format_parse/messages/

## Related ADRs

- ADR 001: Migrate to Next.js with TypeScript and Database (established the App Router architecture this builds on)
- ADR 003: Static Generation with ISR (print pages and metadata generation must remain compatible)
