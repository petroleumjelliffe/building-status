'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key) return;

    posthog.init(key, {
      api_host: host || 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'cookie',
      __add_tracing_headers: [window.location.origin],
    });

    // Tag every client event with the environment so prod/dev
    // are filterable in a single PostHog project.
    posthog.register({
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV
        || process.env.NODE_ENV
        || 'development',
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
