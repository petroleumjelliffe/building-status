import { NextRequest, NextResponse } from 'next/server';
import { getShortLinkByCode } from '@/lib/short-link';
import { getPropertyById } from '@/lib/property';
import { getAccessTokenById } from '@/lib/qr-code';
import { buildQRCodeUrl } from '@/lib/qr-url';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  const link = await getShortLinkByCode(code);
  if (!link) {
    // Short link not found or inactive — redirect to homepage
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  const property = await getPropertyById(link.propertyId);
  if (!property) {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  // Look up auth token string if this link has an access token
  let authToken: string | undefined;
  if (link.accessTokenId) {
    const accessToken = await getAccessTokenById(link.accessTokenId);
    if (accessToken?.isActive) {
      authToken = accessToken.token;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  const destinationUrl = buildQRCodeUrl({
    baseUrl,
    propertyHash: property.hash,
    authToken,
    unit: link.unit ?? undefined,
    utmCampaign: link.campaign,
    utmContent: link.content ?? undefined,
  });

  return NextResponse.redirect(destinationUrl, 302);
}
