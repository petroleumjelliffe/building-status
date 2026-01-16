import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { updateMaintenance } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateMaintenanceRequest } from '@/types';

/**
 * PUT /api/maintenance/[id]
 * Update an existing maintenance item
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateMaintenanceRequest = await request.json();
    const { password, date, description } = body;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid maintenance ID' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
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
