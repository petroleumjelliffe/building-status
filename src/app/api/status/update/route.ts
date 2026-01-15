import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyPassword } from '@/lib/auth';
import { updateSystemStatus } from '@/lib/queries';
import type { SystemStatus } from '@/types';

/**
 * POST /api/status/update
 * Updates a system status
 *
 * Body: {
 *   password: string,
 *   systemId: string,
 *   status: 'ok' | 'issue' | 'down',
 *   count?: string,
 *   note?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, systemId, status, count, note } = body;

    // Verify password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is required',
        },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid password',
        },
        { status: 401 }
      );
    }

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
