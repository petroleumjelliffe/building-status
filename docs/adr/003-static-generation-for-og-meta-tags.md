# ADR 003: Force Static Generation with ISR for Open Graph Meta Tags

## Status
Accepted

## Context

When using Next.js 15 App Router with async `generateMetadata()`, meta tags were being streamed AFTER the `</head>` and `</body>` tags instead of appearing inside the `<head>` section in the initial HTML response.

### The Problem

Social media crawlers (Facebook, Twitter, LinkedIn) do not execute JavaScript and only read the initial server-rendered HTML. When Next.js streams the response:

1. HTML shell is sent immediately with minimal `<head>` content
2. Page body begins streaming
3. Async metadata results are injected later via React Suspense streaming
4. Meta tags appear after `</body>` tag (too late for crawlers)

This breaks social media link previews because the Open Graph image and metadata are not in the `<head>` when crawlers read the page.

### Why unstable_cache Didn't Solve It

While `unstable_cache()` improved performance after the first request, it didn't prevent the streaming issue because:
- First request (cold cache) still blocked on database queries
- Metadata generation remained async
- Next.js didn't wait for async metadata before initiating streaming
- Subsequent requests were faster but meta tags still streamed late

### Requirements

1. Meta tags must appear inside `<head>` in initial HTML
2. Meta tags must contain dynamic data from PostgreSQL (building status)
3. OG image URL must reflect current status: `h${heat}w${water}l${laundry}.png`
4. Must maintain reasonable performance
5. Must support on-demand revalidation when status updates

## Decision

Force static generation at build time using `export const dynamic = 'error'` combined with Incremental Static Regeneration (ISR) via `export const revalidate = 60`.

### Implementation

```typescript
// src/app/page.tsx
export const dynamic = 'error'; // Force static generation
export const revalidate = 60;   // ISR every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  const data = await getStatusData(); // Direct database call at build time
  // ... generate metadata with dynamic image URL
}

export default async function StatusPage() {
  const data = await getStatusData(); // Same query, build-time execution
  // ... render page
}
```

### How It Works

1. **Build Time:** Page and metadata are generated statically, requiring database connection
2. **Initial HTML:** Meta tags are baked into static HTML in `<head>` ✅
3. **First Request:** Serve pre-generated static file (10-50ms response)
4. **Background ISR:** Page regenerates every 60 seconds automatically
5. **On-Demand:** API mutations call `revalidatePath('/')` for immediate updates

### Data Flow

```
Build/Deploy:
  Next.js build → getStatusData() → PostgreSQL → Static HTML with OG tags

Runtime:
  Request → Serve static HTML (meta tags in <head>) ✅

Every 60s:
  Background → Regenerate static page → Update cached HTML

On Status Update:
  API mutation → revalidatePath('/') → Immediate regeneration
```

## Consequences

### Positive

✅ **Meta Tags Guaranteed in `<head>`** - Static HTML ensures correct placement for all crawlers
✅ **Maximum Performance** - Static file serving (10-50ms TTFB vs 200-500ms SSR)
✅ **Simpler Caching** - No need for `unstable_cache` complexity
✅ **Proven Pattern** - ISR is a standard Next.js pattern for dynamic static pages
✅ **Fresh Data** - 60s automatic updates + instant on-demand revalidation
✅ **Works with Social Media** - Facebook, Twitter, LinkedIn crawlers see correct meta tags

### Negative

⚠️ **Build-Time Database Dependency** - Deployment requires live database connection
⚠️ **Initial Build Slower** - Adds 2-5 seconds to build time for database query
⚠️ **Data Staleness Window** - Newly deployed version shows data up to 60s old
⚠️ **Build Failure Risk** - If database unavailable, build fails (mitigated with fallback)

### Mitigation Strategies

**For Build Failures:**
- Add try/catch in `generateMetadata()` with static fallback defaults
- Use default "all systems OK" image if database unavailable
- CI/CD should verify database connectivity before build

**For Staleness:**
- 60-second staleness is acceptable per original architecture decision
- On-demand revalidation ensures immediate updates when managers edit status
- Critical updates trigger instant regeneration via `revalidatePath('/')`

## Alternatives Considered

### 1. Dynamic SSR with Streaming (Current/Rejected)
- Async metadata → streaming → meta tags after `</body>`
- Breaks social media crawlers
- Rejected: Doesn't meet core requirement

### 2. Client-Side Meta Tag Injection
- Update `<head>` via JavaScript after page load
- Same as old `index.html` approach
- Rejected: Crawlers don't execute JavaScript

### 3. Pre-render with generateStaticParams
- Similar to chosen approach but more configuration
- Overkill for single route
- Rejected: More complex than needed

### 4. Synchronous Metadata
- Make `generateMetadata()` non-async
- Impossible: Database queries are inherently async
- Rejected: Not technically feasible

## References

- Next.js ISR Documentation: https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
- Next.js Route Segment Config: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
- Open Graph Protocol: https://ogp.me/
- Next.js Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

## Related ADRs

- ADR 001: Migrate to Next.js with TypeScript and Database (established 60s revalidation baseline)

## Implementation Date

2026-01-16
