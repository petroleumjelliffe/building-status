import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateContact, deleteContact } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { UpdateContactRequest, DeleteContactRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/contacts/[id]
 * Update an emergency contact
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
    const body: UpdateContactRequest = await request.json();
    const { label, phone, hours } = body;

    // Update contact
    await updateContact(id, { label, phone, hours });

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * Delete an emergency contact
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

    // Delete contact
    await deleteContact(id);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
