import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateSessionToken } from '@/lib/auth';
import { updateSystemStatus } from '@/lib/queries';
import type { SystemStatus } from '@/types';

/**
 * POST /api/status/update
 * Updates a system status
 *
 * Headers: Authorization: Bearer <token>
 * Body: {
 *   systemId: string,
 *   status: 'ok' | 'issue' | 'down',
 *   count?: string,
 *   note?: string
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
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

    // Update the system status
    await updateSystemStatus(
      systemId,
      status as SystemStatus,
      count || undefined,
      note || undefined
    );

    // Trigger on-demand revalidation of the home page
    revalidatePath('/');

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
