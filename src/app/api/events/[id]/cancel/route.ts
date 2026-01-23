import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { getEventById, cancelEvent } from '@/lib/queries';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[id]/cancel
 * Mark an event as cancelled
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(
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

    await cancelEvent(eventId);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
