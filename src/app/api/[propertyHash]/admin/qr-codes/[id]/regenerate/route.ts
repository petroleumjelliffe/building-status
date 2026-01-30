import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessTokens } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { createQRCodeImage } from '@/lib/qr-code';
import { getPropertyByHash } from '@/lib/property';
import { errorResponse, ApiErrors } from '@/lib/api-response';

/**
 * POST /api/[propertyHash]/admin/qr-codes/[id]/regenerate
 * Regenerate QR code image for an existing access token for a property
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
): Promise<Response> {
  try {
    const { propertyHash, id } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return ApiErrors.propertyNotFound();
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!verifyAdminToken(token, property.id)) {
      return ApiErrors.unauthorized();
    }

    const qrCodeId = parseInt(id, 10);

    if (isNaN(qrCodeId)) {
      return errorResponse('Invalid QR code ID', 400);
    }

    // Fetch the existing QR code/access token and verify it belongs to this property
    const [accessToken] = await db
      .select()
      .from(accessTokens)
      .where(
        and(
          eq(accessTokens.id, qrCodeId),
          eq(accessTokens.propertyId, property.id)
        )
      )
      .limit(1);

    if (!accessToken) {
      return ApiErrors.notFound('QR code');
    }

    // Build the URL with the existing token
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      return errorResponse('NEXT_PUBLIC_SITE_URL environment variable is not set', 500);
    }

    const fullUrl = `${baseUrl}/${property.hash}?auth=${accessToken.token}`;

    // Regenerate the QR code image
    const qrCodeDataUrl = await createQRCodeImage(fullUrl);

    return NextResponse.json({
      qrCodeDataUrl,
      fullUrl,
    });
  } catch (error) {
    console.error('[API] Error regenerating QR code:', error);
    return ApiErrors.internal();
  }
}
