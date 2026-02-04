// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  ANALYTICS_EVENTS,
  ALL_EVENT_NAMES,
  SERVER_EVENT_NAMES,
  CLIENT_EVENT_NAMES,
} from '@/lib/analytics-events';
import fs from 'fs';
import path from 'path';

describe('Analytics Data Dictionary', () => {
  it('every event has a description and source', () => {
    for (const [name, def] of Object.entries(ANALYTICS_EVENTS)) {
      expect(def.description, `${name} missing description`).toBeTruthy();
      expect(['server', 'client'], `${name} has invalid source`).toContain(def.source);
    }
  });

  it('SERVER_EVENT_NAMES only contains server-sourced events', () => {
    for (const name of SERVER_EVENT_NAMES) {
      expect(ANALYTICS_EVENTS[name].source).toBe('server');
    }
  });

  it('CLIENT_EVENT_NAMES only contains client-sourced events', () => {
    for (const name of CLIENT_EVENT_NAMES) {
      expect(ANALYTICS_EVENTS[name].source).toBe('client');
    }
  });

  it('ALL_EVENT_NAMES is the union of server and client events', () => {
    const combined = [...SERVER_EVENT_NAMES, ...CLIENT_EVENT_NAMES].sort();
    expect([...ALL_EVENT_NAMES].sort()).toEqual(combined);
  });

  it('all event names follow Title Case naming convention', () => {
    for (const name of ALL_EVENT_NAMES) {
      // Each word should start with an uppercase letter
      const words = name.split(' ');
      for (const word of words) {
        expect(
          word[0] === word[0].toUpperCase(),
          `"${name}" has non-title-case word "${word}"`
        ).toBe(true);
      }
    }
  });
});

describe('getPostHogDistinctId', () => {
  const MOCK_KEY = 'phc_test123';

  it('returns null when no cookie header', async () => {
    const { getPostHogDistinctId } = await import('@/lib/posthog');
    const request = new Request('http://localhost/api/test');
    expect(getPostHogDistinctId(request, MOCK_KEY)).toBeNull();
  });

  it('returns null when PostHog cookie is not present', async () => {
    const { getPostHogDistinctId } = await import('@/lib/posthog');
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: 'other_cookie=value' },
    });
    expect(getPostHogDistinctId(request, MOCK_KEY)).toBeNull();
  });

  it('extracts distinct_id from PostHog cookie', async () => {
    const { getPostHogDistinctId } = await import('@/lib/posthog');
    const cookieValue = JSON.stringify({ distinct_id: 'user_abc123' });
    const encoded = encodeURIComponent(cookieValue);
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: `ph_${MOCK_KEY}_posthog=${encoded}` },
    });
    expect(getPostHogDistinctId(request, MOCK_KEY)).toBe('user_abc123');
  });

  it('handles PostHog cookie among multiple cookies', async () => {
    const { getPostHogDistinctId } = await import('@/lib/posthog');
    const cookieValue = JSON.stringify({ distinct_id: 'user_xyz' });
    const encoded = encodeURIComponent(cookieValue);
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: `session=abc; ph_${MOCK_KEY}_posthog=${encoded}; other=123` },
    });
    expect(getPostHogDistinctId(request, MOCK_KEY)).toBe('user_xyz');
  });

  it('returns null for malformed cookie JSON', async () => {
    const { getPostHogDistinctId } = await import('@/lib/posthog');
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: `ph_${MOCK_KEY}_posthog=not-json` },
    });
    expect(getPostHogDistinctId(request, MOCK_KEY)).toBeNull();
  });

  it('returns null when distinct_id is missing from cookie', async () => {
    const { getPostHogDistinctId } = await import('@/lib/posthog');
    const cookieValue = JSON.stringify({ some_other_field: 'value' });
    const encoded = encodeURIComponent(cookieValue);
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: `ph_${MOCK_KEY}_posthog=${encoded}` },
    });
    expect(getPostHogDistinctId(request, MOCK_KEY)).toBeNull();
  });

  it('returns null when no API key is provided', async () => {
    const { getPostHogDistinctId } = await import('@/lib/posthog');
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: 'ph_anything_posthog={}' },
    });
    expect(getPostHogDistinctId(request, '')).toBeNull();
  });
});

describe('No internal database IDs in analytics properties', () => {
  /**
   * Internal numeric database IDs (e.g. propertyId) must never appear in
   * analytics event properties. They leak implementation details to third-party
   * services and are meaningless outside our database.
   *
   * Use opaque identifiers instead — e.g. propertyHash instead of propertyId.
   */
  const BANNED_PROPERTY_NAMES = [
    'propertyId',  // use propertyHash
  ];

  it('AnalyticsEventProperties must not contain banned field names', () => {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'analytics-events.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract the AnalyticsEventProperties interface block
    const propsMatch = content.match(
      /export interface AnalyticsEventProperties \{[\s\S]*?\n\}/
    );
    expect(propsMatch, 'Could not find AnalyticsEventProperties interface').not.toBeNull();

    const propsBlock = propsMatch![0];

    for (const banned of BANNED_PROPERTY_NAMES) {
      expect(
        propsBlock.includes(banned),
        `AnalyticsEventProperties contains "${banned}". ` +
        `Internal database IDs must not be sent to analytics. ` +
        `Use the opaque hash/string equivalent instead.`
      ).toBe(false);
    }
  });

  it('trackServerEvent call sites must not pass banned field names', () => {
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
    const routeFiles = findFilesRecursive(apiDir, 'route.ts');

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      // Find all trackServerEvent calls and check their property objects
      const trackCalls = content.match(/trackServerEvent\([\s\S]*?\}\)/g) || [];
      for (const call of trackCalls) {
        for (const banned of BANNED_PROPERTY_NAMES) {
          expect(
            call.includes(banned),
            `${relativePath} passes "${banned}" to trackServerEvent. ` +
            `Use the opaque hash/string equivalent instead.`
          ).toBe(false);
        }
      }
    }
  });
});

describe('No direct posthog.capture() calls outside analytics modules', () => {
  it('API routes use trackServerEvent, not getPostHogClient().capture()', () => {
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
    const routeFiles = findFilesRecursive(apiDir, 'route.ts');

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // Should not import getPostHogClient directly
      expect(
        content.includes('getPostHogClient'),
        `${path.relative(process.cwd(), file)} imports getPostHogClient directly — use trackServerEvent instead`
      ).toBe(false);

      // Should not call .capture() directly
      expect(
        content.includes('.capture('),
        `${path.relative(process.cwd(), file)} calls .capture() directly — use trackServerEvent instead`
      ).toBe(false);
    }
  });

  it('client components use useTrackEvent, not posthog.capture()', () => {
    const componentsDir = path.join(process.cwd(), 'src', 'components');
    const tsxFiles = findFilesRecursive(componentsDir, '.tsx');

    for (const file of tsxFiles) {
      // Skip the PostHogProvider itself
      if (file.includes('PostHogProvider')) continue;

      const content = fs.readFileSync(file, 'utf-8');

      expect(
        content.includes('posthog.capture('),
        `${path.relative(process.cwd(), file)} calls posthog.capture() directly — use useTrackEvent instead`
      ).toBe(false);
    }
  });
});

/**
 * Recursively find files matching a suffix in a directory
 */
function findFilesRecursive(dir: string, suffix: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(fullPath, suffix));
    } else if (entry.name.endsWith(suffix)) {
      results.push(fullPath);
    }
  }
  return results;
}
