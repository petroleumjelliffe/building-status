import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessTokens } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createQRCodeImage } from '@/lib/qr-code';

/**
 * POST /api/admin/qr-codes/[id]/regenerate
 * Regenerate QR code image for an existing access token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const qrCodeId = parseInt(params.id, 10);

    if (isNaN(qrCodeId)) {
      return NextResponse.json(
        { error: 'Invalid QR code ID' },
        { status: 400 }
      );
    }

    // Fetch the existing QR code/access token
    const [accessToken] = await db
      .select()
      .from(accessTokens)
      .where(eq(accessTokens.id, qrCodeId))
      .limit(1);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      );
    }

    // Get property hash for URL generation
    const property = await db.query.properties.findFirst({
      where: (properties, { eq }) => eq(properties.id, accessToken.propertyId),
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Build the URL with the existing token
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL environment variable is not set' },
        { status: 500 }
      );
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
