import { validateSessionToken } from '@/lib/auth';
import { getEventById, cancelEvent } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import type { CancelEventResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/events/[id]/cancel
 * Mark an event as cancelled for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {CancelEventResponse}
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

    const eventId = parseInt(id, 10);

    // Check if event exists for this property
    const existing = await getEventById(eventId, property.id);
    if (!existing) {
      return ApiErrors.notFound('Event');
    }

    await cancelEvent(eventId, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error cancelling event:', error);
    return ApiErrors.internal();
  }
}
