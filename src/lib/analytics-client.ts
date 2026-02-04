'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';
import type { ClientEventName, AnalyticsEventProperties } from './analytics-events';

/**
 * Hook for tracking client-side analytics events with typed properties.
 * Uses the data dictionary to enforce event names and payloads at compile time.
 */
export function useTrackEvent() {
  const posthog = usePostHog();

  return useCallback(<E extends ClientEventName>(
    event: E,
    properties: AnalyticsEventProperties[E],
  ) => {
    posthog.capture(event, properties);
  }, [posthog]);
}
