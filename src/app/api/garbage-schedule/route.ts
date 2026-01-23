import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateGarbageSchedule } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateGarbageScheduleRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/garbage-schedule
 * Update the garbage and recycling schedule
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(request: Request) {
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

    const body: UpdateGarbageScheduleRequest = await request.json();
    const { trash, recycling, notes } = body;

    // Validate required fields
    if (!trash || !recycling) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update garbage schedule
    await updateGarbageSchedule({ trash, recycling, notes });

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating garbage schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
