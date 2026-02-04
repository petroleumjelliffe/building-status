import { validateSessionToken } from '@/lib/auth';
import { createEvent, getScheduledEvents } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { dataResponse, createResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import { trackServerEvent } from '@/lib/posthog';
import type { CreateEventRequest, EventType, GetEventsResponse, CreateEventResponse, EventListResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/[propertyHash]/events
 * Get all scheduled events for a property
 * @returns {GetEventsResponse}
 */
export async function GET(
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

    const events = await getScheduledEvents(property.id);
    return dataResponse<EventListResponse>({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return ApiErrors.internal();
  }
}

/**
 * POST /api/[propertyHash]/events
 * Create a new calendar event for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {CreateEventResponse}
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

    // Verify session token is valid and bound to this property
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token, property.id)) {
      return ApiErrors.unauthorized();
    }

    const body: CreateEventRequest = await request.json();
    const { type, title, startsAt, description, endsAt, allDay, timezone, recurrenceRule, notifyBeforeMinutes } = body;

    // Validate required fields
    if (!type || !title || !startsAt) {
      return ApiErrors.missingFields('type, title, startsAt');
    }

    // Validate event type
    const validTypes: EventType[] = ['maintenance', 'announcement', 'outage'];
    if (!validTypes.includes(type)) {
      return errorResponse('Invalid event type', 400);
    }

    // Create event with propertyId
    const id = await createEvent(property.id, type, title, new Date(startsAt), {
      description,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      allDay,
      timezone,
      recurrenceRule,
      notifyBeforeMinutes,
    });

    trackServerEvent(request, 'Event Created', {
      propertyId: property.id, eventType: type,
    });

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return createResponse(id);
  } catch (error) {
    console.error('Error creating event:', error);
    return ApiErrors.internal();
  }
}
