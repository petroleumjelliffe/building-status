/**
 * Builds a QR code URL with UTM parameters and optional auth/unit params.
 *
 * All QR code generation sites should use this utility to ensure
 * consistent UTM tagging across admin QR codes, unit cards,
 * property signs, and maintenance signs.
 */

export interface QRCodeUrlOptions {
  baseUrl: string;
  propertyHash: string;
  authToken?: string;
  unit?: string;
  utmSource?: string;    // default: 'qr'
  utmMedium?: string;    // default: 'print'
  utmCampaign: string;   // required
  utmContent?: string;
}

export function buildQRCodeUrl(options: QRCodeUrlOptions): string {
  const {
    baseUrl,
    propertyHash,
    authToken,
    unit,
    utmSource = 'qr',
    utmMedium = 'print',
    utmCampaign,
    utmContent,
  } = options;

  const url = new URL(`/${propertyHash}`, baseUrl);

  if (authToken) {
    url.searchParams.set('auth', authToken);
  }

  if (unit) {
    url.searchParams.set('unit', unit);
  }

  url.searchParams.set('utm_source', utmSource);
  url.searchParams.set('utm_medium', utmMedium);
  url.searchParams.set('utm_campaign', utmCampaign);

  if (utmContent) {
    url.searchParams.set('utm_content', utmContent);
  }

  return url.toString();
}
