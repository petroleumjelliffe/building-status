import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { completeMaintenance } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CompleteMaintenanceRequest } from '@/types';

/**
 * POST /api/maintenance/[id]/complete
 * Mark a maintenance item as completed (soft delete)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: CompleteMaintenanceRequest = await request.json();
    const { password } = body;
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

    // Complete maintenance
    await completeMaintenance(id);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing maintenance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
