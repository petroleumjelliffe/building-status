import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { toggleAccessToken } from '@/lib/qr-code';

/**
 * PATCH /api/admin/qr-codes/[id]
 * Toggle the active status of a QR code
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Toggle QR code status
    const qrCodeId = parseInt(params.id);
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
