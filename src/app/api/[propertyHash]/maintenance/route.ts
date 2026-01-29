import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createMaintenance } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import type { CreateMaintenanceRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/maintenance
 * Create a new maintenance item for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(
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

    // Create maintenance with propertyId
    const id = await createMaintenance(property.id, date, description);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating maintenance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
