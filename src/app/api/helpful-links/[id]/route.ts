import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateHelpfulLink, deleteHelpfulLink } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateHelpfulLinkRequest, DeleteHelpfulLinkRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/helpful-links/[id]
 * Update a helpful link
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const body: UpdateHelpfulLinkRequest = await request.json();
    const { title, url, icon } = body;

    // Update helpful link
    await updateHelpfulLink(id, { title, url, icon });

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating helpful link:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/helpful-links/[id]
 * Delete a helpful link
 *
 * Headers: Authorization: Bearer <token>
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Delete helpful link
    await deleteHelpfulLink(id);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting helpful link:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
