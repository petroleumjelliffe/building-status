import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { generatePropertyQRCode, getAccessTokensForProperty, getAllAccessTokens } from '@/lib/qr-code';
import { getPropertyById } from '@/lib/property';

/**
 * GET /api/admin/qr-codes
 * List all QR codes (optionally filtered by property)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const isValid = await verifyAdminToken(token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get propertyId filter from query params
    const url = new URL(request.url);
    const propertyIdParam = url.searchParams.get('propertyId');

    let qrCodes;
    if (propertyIdParam) {
      const propertyId = parseInt(propertyIdParam);
      qrCodes = await getAccessTokensForProperty(propertyId);
    } else {
      qrCodes = await getAllAccessTokens();
    }

    return NextResponse.json({
      qrCodes: qrCodes.map(qr => ({
        id: qr.id,
        propertyId: qr.propertyId,
        token: qr.token,
        label: qr.label,
        isActive: qr.isActive,
        createdAt: qr.createdAt,
        expiresAt: qr.expiresAt,
      })),
    });
  } catch (error) {
    console.error('[API] Error fetching QR codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/qr-codes
 * Generate a new QR code
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const isValid = await verifyAdminToken(token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { propertyId, label, expiresAt } = body;

    if (!propertyId || !label) {
      return NextResponse.json(
        { error: 'propertyId and label are required' },
        { status: 400 }
      );
    }

    // Get property to get the hash
    const property = await getPropertyById(propertyId);
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Generate QR code
    const qrCodeData = await generatePropertyQRCode(
      propertyId,
      property.hash,
      label,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({
      tokenId: qrCodeData.tokenId,
      token: qrCodeData.token,
      qrCodeDataUrl: qrCodeData.qrCodeDataUrl,
      fullUrl: qrCodeData.fullUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
