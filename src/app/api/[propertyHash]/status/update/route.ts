import { revalidatePath } from 'next/cache';
import { validateSessionToken } from '@/lib/auth';
import { updateSystemStatus } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import { getPostHogClient } from '@/lib/posthog';
import type { SystemStatus, UpdateSystemStatusResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/status/update
 * Updates a system status for a property
 *
 * Headers: Authorization: Bearer <token>
 * Body: {
 *   systemId: string,
 *   status: 'ok' | 'issue' | 'down',
 *   count?: string,
 *   note?: string
 * }
 * @returns {UpdateSystemStatusResponse}
 */
export async function POST(
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
    const { systemId, status, count, note } = body;

    // Validate inputs
    if (!systemId || typeof systemId !== 'string') {
      return errorResponse('System ID is required', 400);
    }

    const validStatuses: SystemStatus[] = ['ok', 'issue', 'down'];
    if (!status || !validStatuses.includes(status as SystemStatus)) {
      return errorResponse('Valid status is required (ok, issue, or down)', 400);
    }

    // Update the system status with propertyId
    await updateSystemStatus(
      property.id,
      systemId,
      status as SystemStatus,
      count || undefined,
      note || undefined
    );

    getPostHogClient().capture({
      distinctId: `property:${property.id}`,
      event: 'status_update',
      properties: { propertyId: property.id, systemId, status },
    });

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating status:', error);
    return ApiErrors.internal();
  }
}
