import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { updateIssue } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateIssueRequest } from '@/types';

/**
 * PUT /api/issues/[id]
 * Update an existing issue
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateIssueRequest = await request.json();
    const { password, category, location, detail, status, icon } = body;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid issue ID' },
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

    // Build updates object with only provided fields
    const updates: any = {};
    if (category !== undefined) updates.category = category;
    if (location !== undefined) updates.location = location;
    if (detail !== undefined) updates.detail = detail;
    if (status !== undefined) updates.status = status;
    if (icon !== undefined) updates.icon = icon;

    // Update issue
    await updateIssue(id, updates);

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
