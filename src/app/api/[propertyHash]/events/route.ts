import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createEvent, getScheduledEvents } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import type { CreateEventRequest, EventType } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/[propertyHash]/events
 * Get all scheduled events for a property
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
) {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const events = await getScheduledEvents(property.id);
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/[propertyHash]/events
 * Create a new calendar event for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
) {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or missing session token' },
        { status: 401 }
      );
    }

    const body: CreateEventRequest = await request.json();
    const { type, title, startsAt, description, endsAt, allDay, timezone, recurrenceRule, notifyBeforeMinutes } = body;

    // Validate required fields
    if (!type || !title || !startsAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, startsAt' },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes: EventType[] = ['maintenance', 'announcement', 'outage'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      );
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

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
