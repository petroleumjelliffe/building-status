import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { getEventById, updateEvent, deleteEvent } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateEventRequest, EventType, EventStatus } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]
 * Get a single event by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getEventById(parseInt(id, 10));

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]
 * Update an existing event
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const eventId = parseInt(id, 10);
    const body: UpdateEventRequest = await request.json();

    // Check if event exists
    const existing = await getEventById(eventId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Parameters<typeof updateEvent>[1] = {};

    if (body.type !== undefined) {
      const validTypes: EventType[] = ['maintenance', 'announcement', 'outage'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid event type' },
          { status: 400 }
        );
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
        return NextResponse.json(
          { success: false, error: 'Invalid event status' },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }
    if (body.notifyBeforeMinutes !== undefined) updates.notifyBeforeMinutes = body.notifyBeforeMinutes;

    await updateEvent(eventId, updates);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Delete an event permanently
 *
 * Headers: Authorization: Bearer <token>
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const eventId = parseInt(id, 10);

    // Check if event exists
    const existing = await getEventById(eventId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    await deleteEvent(eventId);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
