import { revalidatePath } from 'next/cache';
import { validateSessionToken } from '@/lib/auth';
import { updateAnnouncement, deleteAnnouncement } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import type { AnnouncementType, UpdateAnnouncementResponse, DeleteAnnouncementResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/[propertyHash]/announcements/[id]
 * Update an existing announcement for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateAnnouncementResponse}
 */
export async function PATCH(
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

    const announcementId = parseInt(id, 10);
    const body = await request.json();

    // Build update object
    const updates: Parameters<typeof updateAnnouncement>[2] = {};

    if (body.type !== undefined) {
      const validTypes: AnnouncementType[] = ['warning', 'info', 'alert'];
      if (!validTypes.includes(body.type as AnnouncementType)) {
        return errorResponse('Invalid announcement type', 400);
      }
      updates.type = body.type;
    }

    if (body.message !== undefined) updates.message = body.message;
    if (body.expiresAt !== undefined) {
      updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    // updateAnnouncement verifies ownership internally
    await updateAnnouncement(announcementId, property.id, updates);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating announcement:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return ApiErrors.notFound('Announcement');
    }

    return ApiErrors.internal();
  }
}

/**
 * DELETE /api/[propertyHash]/announcements/[id]
 * Delete an announcement for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {DeleteAnnouncementResponse}
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

    const announcementId = parseInt(id, 10);

    // deleteAnnouncement verifies ownership internally
    await deleteAnnouncement(announcementId, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error deleting announcement:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return ApiErrors.notFound('Announcement');
    }

    return ApiErrors.internal();
  }
}
