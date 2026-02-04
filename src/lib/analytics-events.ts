/**
 * Analytics Event Data Dictionary
 *
 * Single source of truth for all analytics events.
 * All tracking calls (server and client) must use events defined here.
 * Tests verify no direct posthog.capture() calls bypass this dictionary.
 *
 * Naming convention: Title Case, "Noun Verbed" (past tense)
 *   e.g. "Issue Created", "Admin Logged In", "QR Code Scanned"
 *
 * To add a new event:
 *   1. Add it to ANALYTICS_EVENTS below
 *   2. Add its property type to AnalyticsEventProperties
 *   3. Use trackServerEvent() or useTrackEvent() to fire it
 */

// ---------------------------------------------------------------------------
// Event Definitions
// ---------------------------------------------------------------------------

export const ANALYTICS_EVENTS = {
  // -- Resident funnel --
  'QR Code Scanned': {
    description: 'Resident scans a QR code to access the status page',
    source: 'server' as const,
  },

  // -- Manager funnel --
  'Admin Logged In': {
    description: 'Manager logs in to the admin dashboard',
    source: 'server' as const,
  },
  'Status Updated': {
    description: 'Manager updates a system status (heat, water, laundry)',
    source: 'server' as const,
  },
  'Issue Created': {
    description: 'Manager creates a new building issue',
    source: 'server' as const,
  },
  'Issue Resolved': {
    description: 'Manager resolves a building issue',
    source: 'server' as const,
  },
  'Announcement Created': {
    description: 'Manager creates a new announcement',
    source: 'server' as const,
  },
  'Announcement Updated': {
    description: 'Manager updates an existing announcement',
    source: 'server' as const,
  },
  'Event Created': {
    description: 'Manager creates a calendar event',
    source: 'server' as const,
  },

  // -- Engagement --
  'Calendar Feed Accessed': {
    description: 'Someone accesses the iCal feed',
    source: 'server' as const,
  },
  'Share Clicked': {
    description: 'User clicks the share button',
    source: 'client' as const,
  },
  'Share Completed': {
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
  'QR Code Scanned': {
    propertyId: number;
    accessTokenId: number;
    unit?: string;
  };
  'Admin Logged In': {
    propertyId: number;
  };
  'Status Updated': {
    propertyId: number;
    systemId: string;
    status: string;
  };
  'Issue Created': {
    propertyId: number;
    category: string;
  };
  'Issue Resolved': {
    propertyId: number;
    issueId: number;
  };
  'Announcement Created': {
    propertyId: number;
    type: string;
  };
  'Announcement Updated': {
    propertyId: number;
    type: string;
  };
  'Event Created': {
    propertyId: number;
    eventType: string;
  };
  'Calendar Feed Accessed': {
    propertyId: number;
    typeFilter: string;
  };
  'Share Clicked': Record<string, never>;
  'Share Completed': {
    method: 'native_file' | 'native_url' | 'clipboard' | 'clipboard_legacy';
  };
}
