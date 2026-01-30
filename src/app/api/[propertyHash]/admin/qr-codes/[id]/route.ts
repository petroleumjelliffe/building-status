import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { toggleAccessToken, getAccessTokenById } from '@/lib/qr-code';
import { getPropertyByHash } from '@/lib/property';

/**
 * PATCH /api/[propertyHash]/admin/qr-codes/[id]
 * Toggle the active status of a QR code for a property
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
) {
  try {
    const { propertyHash, id } = await params;

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
    const isValid = await verifyAdminToken(token, property.id);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const qrCodeId = parseInt(id);

    // Verify the QR code belongs to this property
    const accessToken = await getAccessTokenById(qrCodeId);
    if (!accessToken || accessToken.propertyId !== property.id) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      );
    }

    // Toggle QR code status
    await toggleAccessToken(qrCodeId, isActive);

    return NextResponse.json({
      success: true,
      message: `QR code ${isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error('[API] Error toggling QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
