import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateMaintenance } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateMaintenanceRequest } from '@/types';

/**
 * PUT /api/maintenance/[id]
 * Update an existing maintenance item
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(
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

    const body: UpdateMaintenanceRequest = await request.json();
    const { date, description } = body;
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid maintenance ID' },
        { status: 400 }
      );
    }

    // Build updates object with only provided fields
    const updates: any = {};
    if (date !== undefined) updates.date = date;
    if (description !== undefined) updates.description = description;

    // Update maintenance
    await updateMaintenance(id, updates);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating maintenance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
