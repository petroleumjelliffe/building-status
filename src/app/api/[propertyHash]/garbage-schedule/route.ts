import { validateSessionToken } from '@/lib/auth';
import { updateGarbageSchedule } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import type { UpdateGarbageScheduleRequest, UpdateGarbageScheduleResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/[propertyHash]/garbage-schedule
 * Update the garbage and recycling schedule for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateGarbageScheduleResponse}
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

    const body: UpdateGarbageScheduleRequest = await request.json();
    const { trash, recycling, notes } = body;

    // Validate required fields
    if (!trash || !recycling) {
      return ApiErrors.missingFields('trash, recycling');
    }

    // Update garbage schedule with propertyId
    await updateGarbageSchedule({ trash, recycling, notes }, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating garbage schedule:', error);
    return ApiErrors.internal();
  }
}
