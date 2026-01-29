import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { completeMaintenance } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/maintenance/[id]/complete
 * Mark a maintenance item as completed for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
) {
  try {
    const { propertyHash, id } = await params;

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

    const maintenanceId = parseInt(id, 10);

    // completeMaintenance verifies ownership internally
    await completeMaintenance(maintenanceId, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing maintenance:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { success: false, error: 'Maintenance item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
