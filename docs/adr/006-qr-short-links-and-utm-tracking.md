# ADR 006: QR Code Short Links and UTM Tracking

## Status
**Proposed** - Draft for review

## Context

The current QR code system has several limitations:

- **Long URLs produce complex QR codes.** Admin QR codes encode `{SITE_URL}/{hash}?auth={43-char-token}` (~80+ chars), resulting in dense QR patterns that are harder to scan reliably at small sizes.
- **No traffic attribution.** QR scans and direct visits are indistinguishable in PostHog and GA4 because there are no UTM parameters on QR code URLs.
- **No unit-level identification.** Unit cards all share the same QR code — a scan from unit 4A looks identical to one from unit 2B.
- **URLs are immutable once printed.** If a destination changes or a token is revoked, the printed QR code becomes useless.
- **Maintenance sign URL bug.** The maintenance sign builds `/{hash}/issue/{id}` which doesn't correspond to any existing route.
- **StatusPageClient strips all query params.** The auth redirect uses `window.location.pathname`, which would destroy any UTM params even if they were added.

## Decision

### 1. Short Link Redirect Layer

Introduce a `shortLinks` table and a `/s/[code]` redirect route. All QR codes encode a short URL (e.g., `status.example.com/s/a7x9Km`) instead of the full destination URL.

```
QR Code → /s/{code} → 302 redirect → /{hash}?auth=...&unit=...&utm_source=qr&utm_medium=print&utm_campaign=...
```

The short link record stores the property reference, optional access token, optional unit, and UTM campaign/content values. The redirect route looks up the record, constructs the full destination URL with all parameters, and issues a 302 redirect.

**302 (not 301)** so browsers don't cache the redirect permanently, allowing destination updates without cache invalidation issues.

#### `short_links` Table

```sql
CREATE TABLE short_links (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(8) UNIQUE NOT NULL,
  property_id     INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  access_token_id INTEGER REFERENCES access_tokens(id) ON DELETE SET NULL,
  unit            VARCHAR(50),
  campaign        VARCHAR(100) NOT NULL,
  content         VARCHAR(255),
  label           VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW() NOT NULL
);
```

Short codes: `randomBytes(6).toString('base64url')` produces 8 URL-safe characters. Collision check on insert with retry.

### 2. UTM Parameters Injected at Redirect Time

UTM parameters are never embedded in the QR code URL itself. The redirect route appends them based on the short link record:

| QR Type | utm_source | utm_medium | utm_campaign | utm_content |
|---------|-----------|------------|--------------|-------------|
| Admin-generated | `qr` | `print` | `admin` | `{label}` |
| Unit card | `qr` | `print` | `unit_card` | `{unitNumber}` |
| Property sign | `qr` | `print` | `property_sign` | `{location}` |
| Maintenance sign | `qr` | `print` | `maintenance_sign` | `general` |

PostHog autocapture picks up `$utm_source`, `$utm_campaign`, etc. from the URL on the landing `$pageview`. GA4 does the same via its built-in UTM attribution.

### 3. Unit-Specific QR Codes with Access Tokens

Each unit card gets its own access token (for identification, not admin access) and its own short link with `unit={unitNumber}`. When a resident scans, the redirect includes both `?auth={token}&unit=4A`. The validate endpoint creates a resident session and tracks the `QR Code Scanned` event with the `unit` field.

This is not admin auth. It creates a resident session that enables per-unit analytics and potential future unit-specific features (e.g., showing unit-relevant maintenance info).

### 4. StatusPageClient Redirect Fix

Change the auth redirect from stripping all params to stripping only `auth`:

```js
// Before:
window.location.replace(window.location.pathname);

// After:
const url = new URL(window.location.href);
url.searchParams.delete('auth');
window.location.replace(url.pathname + url.search);
```

This preserves UTMs and `unit` in the URL so PostHog/GA4 can attribute the pageview.

### 5. Clean Share URLs

The `ShareButton` component already receives `siteUrl` as a prop (set to `{SITE_URL}/{hash}`), not `window.location.href`. No UTM pollution in shared URLs. No changes needed.

## Consequences

### Positive
- **Simpler QR codes**: ~30 chars vs 80+, faster scanning at small sizes
- **Full traffic attribution**: QR scans vs direct visits clearly separated in analytics
- **Unit-level analytics**: Know which units are actively using the status page
- **Updateable destinations**: Change where a QR code points without reprinting
- **Deactivatable links**: Disable a compromised or outdated QR code
- **Fixes maintenance sign bug**: Short links always point to valid `/{hash}` route

### Negative
- **New database table**: Adds a `short_links` table (minimal complexity)
- **Extra redirect hop**: One 302 redirect adds ~50-100ms latency on QR scan
- **Short link management**: Admin UI may eventually need a way to view/manage short links

### Neutral
- **No schema changes to existing tables**: `accessTokens`, `residentSessions`, etc. unchanged
- **Existing `buildQRCodeUrl` utility**: Repurposed as internal helper for the redirect route (already written)
- **Print page complexity**: Each unit card now generates its own QR code (was shared), but this is the correct behavior

## Alternatives Considered

1. **Embed UTMs directly in QR code URLs** - Rejected. Makes QR codes even longer/denser, and UTMs would pollute share URLs unless stripped.
2. **External URL shortener (Bitly, etc.)** - Rejected. Adds external dependency, cost at scale, and no control over redirect logic or analytics integration.
3. **UTMs via cookies at redirect** - Rejected. PostHog and GA4 specifically look for `utm_*` URL parameters on pageview, not cookies.
4. **No unit identification** - Rejected. Unit-level analytics are valuable for understanding engagement patterns across the building.
