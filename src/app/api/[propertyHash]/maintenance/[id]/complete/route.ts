import { validateSessionToken } from '@/lib/auth';
import { completeMaintenance } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import type { CompleteMaintenanceResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/maintenance/[id]/complete
 * Mark a maintenance item as completed for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {CompleteMaintenanceResponse}
 */
export async function POST(
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

    // completeMaintenance verifies ownership internally
    await completeMaintenance(maintenanceId, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error completing maintenance:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return ApiErrors.notFound('Maintenance item');
    }

    return ApiErrors.internal();
  }
}
