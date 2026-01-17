import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createMaintenance } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CreateMaintenanceRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/maintenance
 * Create a new maintenance item
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

    const body: CreateMaintenanceRequest = await request.json();
    const { date, description } = body;

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
