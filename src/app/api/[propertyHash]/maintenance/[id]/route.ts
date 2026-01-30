import { validateSessionToken } from '@/lib/auth';
import { updateMaintenance } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import type { UpdateMaintenanceResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/[propertyHash]/maintenance/[id]
 * Update an existing maintenance item for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateMaintenanceResponse}
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
): Promise<Response> {
  try {
    const { propertyHash, id } = await params;

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

    const maintenanceId = parseInt(id, 10);
    const body = await request.json();

    // Build update object
    const updates: Parameters<typeof updateMaintenance>[2] = {};

    if (body.date !== undefined) updates.date = body.date;
    if (body.description !== undefined) updates.description = body.description;

    // updateMaintenance verifies ownership internally
    await updateMaintenance(maintenanceId, property.id, updates);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating maintenance:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return ApiErrors.notFound('Maintenance item');
    }

    return ApiErrors.internal();
  }
}
