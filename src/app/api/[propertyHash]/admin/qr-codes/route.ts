import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { generatePropertyQRCode, getAccessTokensForProperty } from '@/lib/qr-code';
import { getPropertyByHash } from '@/lib/property';

/**
 * GET /api/[propertyHash]/admin/qr-codes
 * List all QR codes for a property
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyHash: string }> }
) {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

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

    // Get QR codes for this property only
    const qrCodes = await getAccessTokensForProperty(property.id);

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
 * POST /api/[propertyHash]/admin/qr-codes
 * Generate a new QR code for a property
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyHash: string }> }
) {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

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
    const { label, expiresAt } = body;

    if (!label) {
      return NextResponse.json(
        { error: 'label is required' },
        { status: 400 }
      );
    }

    // Generate QR code using property from hash
    const qrCodeData = await generatePropertyQRCode(
      property.id,
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
