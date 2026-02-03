import { PostHog } from 'posthog-node';
import type { ServerEventName, AnalyticsEventProperties } from './analytics-events';

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!apiKey) {
      // Return a no-op client when not configured
      return {
        capture: () => {},
        shutdown: () => Promise.resolve(),
      } as unknown as PostHog;
    }

    posthogClient = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

/**
 * Extract the PostHog distinct_id from the request cookie.
 * PostHog JS SDK stores it in a cookie named `ph_<key>_posthog`
 * when persistence is set to 'cookie'.
 */
export function getPostHogDistinctId(request: Request, overrideKey?: string): string | null {
  const apiKey = overrideKey ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return null;

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookieName = `ph_${apiKey}_posthog`;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const phCookie = cookies.find(c => c.startsWith(`${cookieName}=`));
  if (!phCookie) return null;

  try {
    const value = decodeURIComponent(phCookie.split('=').slice(1).join('='));
    const parsed = JSON.parse(value);
    return parsed.distinct_id || null;
  } catch {
    return null;
  }
}

/**
 * Track a server-side analytics event with typed properties.
 * Links to the browser session via PostHog cookie when available.
 * Falls back to property-scoped ID.
 *
 * Fire-and-forget — never throws, never blocks.
 */
export function trackServerEvent<E extends ServerEventName>(
  request: Request,
  event: E,
  properties: AnalyticsEventProperties[E],
): void {
  const browserDistinctId = getPostHogDistinctId(request);
  const propertyId = (properties as Record<string, unknown>).propertyId;
  const distinctId = browserDistinctId || `property:${propertyId}`;

  getPostHogClient().capture({
    distinctId,
    event,
    properties: {
      ...properties,
      // Tag server events so they're distinguishable in PostHog
      $lib: 'posthog-node',
    },
  });
}
