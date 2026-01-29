import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateIssue } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateIssueRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/issues/[id]
 * Update an existing issue
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const body: UpdateIssueRequest = await request.json();
    const { category, location, detail, status, icon } = body;
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // Build updates object with only provided fields
    const updates: any = {};
    if (category !== undefined) updates.category = category;
    if (location !== undefined) updates.location = location;
    if (detail !== undefined) updates.detail = detail;
    if (status !== undefined) updates.status = status;
    if (icon !== undefined) updates.icon = icon;

    // Update issue
    // TODO: Remove hardcoded propertyId after frontend migration to /api/[propertyHash]/
    const propertyId = 1;
    await updateIssue(id, propertyId, updates);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
