import { validateSessionToken } from '@/lib/auth';
import { updateHelpfulLink, deleteHelpfulLink } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import type { UpdateHelpfulLinkRequest, UpdateHelpfulLinkResponse, DeleteHelpfulLinkResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/[propertyHash]/helpful-links/[id]
 * Update a helpful link for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateHelpfulLinkResponse}
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

    const body: UpdateHelpfulLinkRequest = await request.json();
    const { title, url, icon } = body;

    // Update helpful link with propertyId
    await updateHelpfulLink(id, { title, url, icon }, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating helpful link:', error);
    return ApiErrors.internal();
  }
}

/**
 * DELETE /api/[propertyHash]/helpful-links/[id]
 * Delete a helpful link for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {DeleteHelpfulLinkResponse}
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

    // Delete helpful link with propertyId
    await deleteHelpfulLink(id, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error deleting helpful link:', error);
    return ApiErrors.internal();
  }
}
