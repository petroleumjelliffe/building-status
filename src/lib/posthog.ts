import { PostHog } from 'posthog-node';

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
