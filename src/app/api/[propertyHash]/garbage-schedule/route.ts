import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateGarbageSchedule } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import type { UpdateGarbageScheduleRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/[propertyHash]/garbage-schedule
 * Update the garbage and recycling schedule for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(
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

    if (!validateSessionToken(token, property.id)) {
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

    // Update garbage schedule with propertyId
    await updateGarbageSchedule({ trash, recycling, notes }, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating garbage schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
