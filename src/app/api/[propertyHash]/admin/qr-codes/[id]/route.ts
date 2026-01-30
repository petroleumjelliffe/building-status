import { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { toggleAccessToken, getAccessTokenById } from '@/lib/qr-code';
import { getPropertyByHash } from '@/lib/property';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api-response';

/**
 * PATCH /api/[propertyHash]/admin/qr-codes/[id]
 * Toggle the active status of a QR code for a property
 */
export async function PATCH(
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiErrors.unauthorized();
    }

    const token = authHeader.substring(7);
    const isValid = await verifyAdminToken(token, property.id);

    if (!isValid) {
      return ApiErrors.unauthorized();
    }

    // Parse request body
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return errorResponse('isActive must be a boolean', 400);
    }

    const qrCodeId = parseInt(id);

    // Verify the QR code belongs to this property
    const accessToken = await getAccessTokenById(qrCodeId);
    if (!accessToken || accessToken.propertyId !== property.id) {
      return ApiErrors.notFound('QR code');
    }

    // Toggle QR code status
    await toggleAccessToken(qrCodeId, isActive);

    return successResponse();
  } catch (error) {
    console.error('[API] Error toggling QR code:', error);
    return ApiErrors.internal();
  }
}
