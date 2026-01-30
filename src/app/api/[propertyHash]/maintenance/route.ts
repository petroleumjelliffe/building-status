import { validateSessionToken } from '@/lib/auth';
import { createMaintenance } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { createResponse, ApiErrors } from '@/lib/api-response';
import type { CreateMaintenanceRequest, CreateMaintenanceResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/maintenance
 * Create a new maintenance item for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {CreateMaintenanceResponse}
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

    const body: CreateMaintenanceRequest = await request.json();
    const { date, description } = body;

    // Validate required fields
    if (!date || !description) {
      return ApiErrors.missingFields('date, description');
    }

    // Create maintenance with propertyId
    const id = await createMaintenance(property.id, date, description);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return createResponse(id);
  } catch (error) {
    console.error('Error creating maintenance:', error);
    return ApiErrors.internal();
  }
}
