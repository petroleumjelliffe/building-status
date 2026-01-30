import { validateSessionToken } from '@/lib/auth';
import { updateReportEmail } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import type { UpdateSettingsResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/[propertyHash]/settings
 * Update site settings (report email) for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateSettingsResponse}
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
): Promise<Response> {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return ApiErrors.propertyNotFound();
    }

    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token, property.id)) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const { reportEmail } = body;

    // Validate required fields
    if (!reportEmail || typeof reportEmail !== 'string') {
      return errorResponse('Missing or invalid reportEmail', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reportEmail)) {
      return errorResponse('Invalid email format', 400);
    }

    // Update report email with propertyId
    await updateReportEmail(reportEmail, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating settings:', error);
    return ApiErrors.internal();
  }
}
