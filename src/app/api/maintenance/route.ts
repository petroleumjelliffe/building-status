import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { createMaintenance } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CreateMaintenanceRequest } from '@/types';

/**
 * POST /api/maintenance
 * Create a new maintenance item
 */
export async function POST(request: Request) {
  try {
    const body: CreateMaintenanceRequest = await request.json();
    const { password, date, description } = body;

    // Verify password
    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!date || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create maintenance
    const id = await createMaintenance(date, description);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating maintenance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
