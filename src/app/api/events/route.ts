import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createEvent, getScheduledEvents } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CreateEventRequest, EventType } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * Get all scheduled events
 */
export async function GET() {
  try {
    const events = await getScheduledEvents();
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
 * POST /api/events
 * Create a new calendar event
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(request: Request) {
  try {
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

    // Create event
    const id = await createEvent(type, title, new Date(startsAt), {
      description,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      allDay,
      timezone,
      recurrenceRule,
      notifyBeforeMinutes,
    });

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
