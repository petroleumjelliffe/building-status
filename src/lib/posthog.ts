import { PostHog } from 'posthog-node';
import { v7 as uuidv7 } from 'uuid';
import type { ServerEventName, AnalyticsEventProperties } from './analytics-events';

let posthogClient: PostHog | null = null;

function getEnvironment(): string {
  return process.env.NEXT_PUBLIC_VERCEL_ENV
    || process.env.NODE_ENV
    || 'development';
}

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!apiKey) {
      // Return a no-op client when not configured
      return {
        capture: () => {},
        identify: () => {},
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
 * Falls back to a random UUID for anonymous requests.
 *
 * Session linking:
 *   - Browser tracing header → uses existing browser session ID
 *   - No browser session → generates a UUIDv7 session ID
 *
 * Automatically tags every event with the current environment.
 *
 * Fire-and-forget — never throws, never blocks.
 */
export function trackServerEvent<E extends ServerEventName>(
  request: Request,
  event: E,
  properties: AnalyticsEventProperties[E],
): void {
  const browserDistinctId = getPostHogDistinctId(request);
  const distinctId = browserDistinctId || uuidv7();

  // Use browser session ID from tracing header, or generate a UUIDv7
  const sessionId = request.headers.get('x-posthog-session-id') || uuidv7();

  getPostHogClient().capture({
    distinctId,
    event,
    properties: {
      ...properties,
      $session_id: sessionId,
      $lib: 'posthog-node',
      environment: getEnvironment(),
    },
  });
}

/**
 * Identify a property as a PostHog person with metadata.
 * Call this on admin login so server-side events are attributed
 * to a known entity with useful person properties.
 */
export function identifyProperty(
  request: Request,
  propertyName: string,
): void {
  const browserDistinctId = getPostHogDistinctId(request);
  const distinctId = browserDistinctId || uuidv7();

  getPostHogClient().identify({
    distinctId,
    properties: {
      property_name: propertyName,
      environment: getEnvironment(),
    },
  });
}
