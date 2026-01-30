import { validateSessionToken } from '@/lib/auth';
import { updateContact, deleteContact } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import type { UpdateContactRequest, UpdateContactResponse, DeleteContactResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/[propertyHash]/contacts/[id]
 * Update an emergency contact for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateContactResponse}
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
): Promise<Response> {
  try {
    const { propertyHash, id } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return ApiErrors.propertyNotFound();
    }

    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token, property.id)) {
      return ApiErrors.unauthorized();
    }

    const body: UpdateContactRequest = await request.json();
    const { label, phone, email, hours } = body;

    // Update contact with propertyId
    await updateContact(id, { label, phone, email, hours }, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating contact:', error);
    return ApiErrors.internal();
  }
}

/**
 * DELETE /api/[propertyHash]/contacts/[id]
 * Delete an emergency contact for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {DeleteContactResponse}
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
): Promise<Response> {
  try {
    const { propertyHash, id } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return ApiErrors.propertyNotFound();
    }

    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token, property.id)) {
      return ApiErrors.unauthorized();
    }

    // Delete contact with propertyId
    await deleteContact(id, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error deleting contact:', error);
    return ApiErrors.internal();
  }
}
