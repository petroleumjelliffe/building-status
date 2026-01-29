import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateSessionToken } from '@/lib/auth';
import { updateSystemStatus } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import type { SystemStatus } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/status/update
 * Updates a system status for a property
 *
 * Headers: Authorization: Bearer <token>
 * Body: {
 *   systemId: string,
 *   status: 'ok' | 'issue' | 'down',
 *   count?: string,
 *   note?: string
 * }
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
        {
          success: false,
          error: 'Unauthorized - Invalid or missing session token',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { systemId, status, count, note } = body;

    // Validate inputs
    if (!systemId || typeof systemId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'System ID is required',
        },
        { status: 400 }
      );
    }

    const validStatuses: SystemStatus[] = ['ok', 'issue', 'down'];
    if (!status || !validStatuses.includes(status as SystemStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid status is required (ok, issue, or down)',
        },
        { status: 400 }
      );
    }

    // Update the system status with propertyId
    await updateSystemStatus(
      property.id,
      systemId,
      status as SystemStatus,
      count || undefined,
      note || undefined
    );

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error('Error updating status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update status',
      },
      { status: 500 }
    );
  }
}
