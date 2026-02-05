import { describe, it, expect } from 'vitest';
import { buildQRCodeUrl } from '@/lib/qr-url';

const BASE = 'https://status.example.com';

describe('buildQRCodeUrl', () => {
  it('builds URL with required UTM params and defaults', () => {
    const url = new URL(buildQRCodeUrl({
      baseUrl: BASE,
      propertyHash: 'abc123',
      utmCampaign: 'admin',
    }));

    expect(url.pathname).toBe('/abc123');
    expect(url.searchParams.get('utm_source')).toBe('qr');
    expect(url.searchParams.get('utm_medium')).toBe('print');
    expect(url.searchParams.get('utm_campaign')).toBe('admin');
    expect(url.searchParams.has('auth')).toBe(false);
    expect(url.searchParams.has('unit')).toBe(false);
    expect(url.searchParams.has('utm_content')).toBe(false);
  });

  it('includes auth token when provided', () => {
    const url = new URL(buildQRCodeUrl({
      baseUrl: BASE,
      propertyHash: 'abc123',
      authToken: 'tok_secret',
      utmCampaign: 'admin',
    }));

    expect(url.searchParams.get('auth')).toBe('tok_secret');
  });

  it('includes unit when provided', () => {
    const url = new URL(buildQRCodeUrl({
      baseUrl: BASE,
      propertyHash: 'abc123',
      unit: '4A',
      utmCampaign: 'unit_card',
    }));

    expect(url.searchParams.get('unit')).toBe('4A');
  });

  it('includes utmContent when provided', () => {
    const url = new URL(buildQRCodeUrl({
      baseUrl: BASE,
      propertyHash: 'abc123',
      utmCampaign: 'property_sign',
      utmContent: 'lobby',
    }));

    expect(url.searchParams.get('utm_content')).toBe('lobby');
  });

  it('allows overriding utm_source and utm_medium', () => {
    const url = new URL(buildQRCodeUrl({
      baseUrl: BASE,
      propertyHash: 'abc123',
      utmSource: 'email',
      utmMedium: 'digital',
      utmCampaign: 'welcome',
    }));

    expect(url.searchParams.get('utm_source')).toBe('email');
    expect(url.searchParams.get('utm_medium')).toBe('digital');
  });

  it('encodes special characters in unit and content', () => {
    const url = new URL(buildQRCodeUrl({
      baseUrl: BASE,
      propertyHash: 'abc123',
      unit: '4A & B',
      utmCampaign: 'unit_card',
      utmContent: 'floor 2 / suite B',
    }));

    expect(url.searchParams.get('unit')).toBe('4A & B');
    expect(url.searchParams.get('utm_content')).toBe('floor 2 / suite B');
  });

  it('produces a complete URL for a unit card', () => {
    const result = buildQRCodeUrl({
      baseUrl: 'https://status.lindenheights.com',
      propertyHash: 'x9f2k',
      unit: '3B',
      utmCampaign: 'unit_card',
      utmContent: '3B',
    });

    const url = new URL(result);
    expect(url.origin).toBe('https://status.lindenheights.com');
    expect(url.pathname).toBe('/x9f2k');
    expect(url.searchParams.get('unit')).toBe('3B');
    expect(url.searchParams.get('utm_source')).toBe('qr');
    expect(url.searchParams.get('utm_campaign')).toBe('unit_card');
  });

  it('produces a complete URL for an admin QR code with auth', () => {
    const result = buildQRCodeUrl({
      baseUrl: 'https://status.lindenheights.com',
      propertyHash: 'x9f2k',
      authToken: 'abc123def456',
      utmCampaign: 'admin',
      utmContent: 'Main Entrance',
    });

    const url = new URL(result);
    expect(url.searchParams.get('auth')).toBe('abc123def456');
    expect(url.searchParams.get('utm_campaign')).toBe('admin');
    expect(url.searchParams.get('utm_content')).toBe('Main Entrance');
    expect(url.searchParams.has('unit')).toBe(false);
  });
});
