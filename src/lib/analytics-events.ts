/**
 * Analytics Event Data Dictionary
 *
 * Single source of truth for all analytics events.
 * All tracking calls (server and client) must use events defined here.
 * Tests verify no direct posthog.capture() calls bypass this dictionary.
 *
 * To add a new event:
 *   1. Add it to ANALYTICS_EVENTS below
 *   2. Add its property type to AnalyticsEventProperties
 *   3. Use trackServerEvent() or trackClientEvent() to fire it
 */

// ---------------------------------------------------------------------------
// Event Definitions
// ---------------------------------------------------------------------------

export const ANALYTICS_EVENTS = {
  // -- Resident funnel --
  qr_scan: {
    description: 'Resident scans a QR code to access the status page',
    source: 'server' as const,
  },

  // -- Manager funnel --
  admin_login: {
    description: 'Manager logs in to the admin dashboard',
    source: 'server' as const,
  },
  status_update: {
    description: 'Manager updates a system status (heat, water, laundry)',
    source: 'server' as const,
  },
  issue_created: {
    description: 'Manager creates a new building issue',
    source: 'server' as const,
  },
  issue_resolved: {
    description: 'Manager resolves a building issue',
    source: 'server' as const,
  },
  announcement_created: {
    description: 'Manager creates a new announcement',
    source: 'server' as const,
  },
  announcement_updated: {
    description: 'Manager updates an existing announcement',
    source: 'server' as const,
  },
  event_created: {
    description: 'Manager creates a calendar event',
    source: 'server' as const,
  },

  // -- Engagement --
  calendar_feed_access: {
    description: 'Someone accesses the iCal feed',
    source: 'server' as const,
  },
  share_click: {
    description: 'User clicks the share button',
    source: 'client' as const,
  },
  share_completed: {
    description: 'Share action completes successfully',
    source: 'client' as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Event Names (derived from dictionary)
// ---------------------------------------------------------------------------

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export type ServerEventName = {
  [K in AnalyticsEventName]: (typeof ANALYTICS_EVENTS)[K]['source'] extends 'server' ? K : never;
}[AnalyticsEventName];

export type ClientEventName = {
  [K in AnalyticsEventName]: (typeof ANALYTICS_EVENTS)[K]['source'] extends 'client' ? K : never;
}[AnalyticsEventName];

export const ALL_EVENT_NAMES = Object.keys(ANALYTICS_EVENTS) as AnalyticsEventName[];

export const SERVER_EVENT_NAMES = Object.entries(ANALYTICS_EVENTS)
  .filter(([, v]) => v.source === 'server')
  .map(([k]) => k) as ServerEventName[];

export const CLIENT_EVENT_NAMES = Object.entries(ANALYTICS_EVENTS)
  .filter(([, v]) => v.source === 'client')
  .map(([k]) => k) as ClientEventName[];

// ---------------------------------------------------------------------------
// Event Property Types (payload per event)
// ---------------------------------------------------------------------------

export interface AnalyticsEventProperties {
  qr_scan: {
    propertyId: number;
    accessTokenId: number;
  };
  admin_login: {
    propertyId: number;
  };
  status_update: {
    propertyId: number;
    systemId: string;
    status: string;
  };
  issue_created: {
    propertyId: number;
    category: string;
  };
  issue_resolved: {
    propertyId: number;
    issueId: number;
  };
  announcement_created: {
    propertyId: number;
    type: string;
  };
  announcement_updated: {
    propertyId: number;
    type: string;
  };
  event_created: {
    propertyId: number;
    eventType: string;
  };
  calendar_feed_access: {
    propertyId: number;
    typeFilter: string;
  };
  share_click: Record<string, never>;
  share_completed: {
    method: 'native_file' | 'native_url' | 'clipboard' | 'clipboard_legacy';
  };
}
