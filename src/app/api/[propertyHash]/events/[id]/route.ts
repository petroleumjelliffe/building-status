import { validateSessionToken } from '@/lib/auth';
import { getEventById, updateEvent, deleteEvent } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { dataResponse, successResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import type { UpdateEventRequest, EventType, EventStatus, EventResponse, UpdateEventResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/[propertyHash]/events/[id]
 * Get a single event by ID for a property
 * @returns {EventResponse | ApiErrorResponse}
 */
export async function GET(
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

    const event = await getEventById(parseInt(id, 10), property.id);

    if (!event) {
      return ApiErrors.notFound('Event');
    }

    return dataResponse<EventResponse>({ success: true, event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return ApiErrors.internal();
  }
}

/**
 * PATCH /api/[propertyHash]/events/[id]
 * Update an existing event for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateEventResponse}
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

    const eventId = parseInt(id, 10);
    const body: UpdateEventRequest = await request.json();

    // Check if event exists for this property
    const existing = await getEventById(eventId, property.id);
    if (!existing) {
      return ApiErrors.notFound('Event');
    }

    // Build update object
    const updates: Parameters<typeof updateEvent>[2] = {};

    if (body.type !== undefined) {
      const validTypes: EventType[] = ['maintenance', 'announcement', 'outage'];
      if (!validTypes.includes(body.type)) {
        return errorResponse('Invalid event type', 400);
      }
      updates.type = body.type;
    }

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.startsAt !== undefined) updates.startsAt = new Date(body.startsAt);
    if (body.endsAt !== undefined) updates.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (body.allDay !== undefined) updates.allDay = body.allDay;
    if (body.timezone !== undefined) updates.timezone = body.timezone;
    if (body.recurrenceRule !== undefined) updates.recurrenceRule = body.recurrenceRule;
    if (body.status !== undefined) {
      const validStatuses: EventStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse('Invalid event status', 400);
      }
      updates.status = body.status;
    }
    if (body.notifyBeforeMinutes !== undefined) updates.notifyBeforeMinutes = body.notifyBeforeMinutes;

    await updateEvent(eventId, property.id, updates);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating event:', error);
    return ApiErrors.internal();
  }
}

/**
 * DELETE /api/[propertyHash]/events/[id]
 * Delete an event permanently for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {ApiSuccessResponse | ApiErrorResponse}
 */
export async function DELETE(
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

    await deleteEvent(eventId, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error deleting event:', error);
    return ApiErrors.internal();
  }
}
