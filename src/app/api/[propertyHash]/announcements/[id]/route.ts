import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateSessionToken } from '@/lib/auth';
import { updateAnnouncement, deleteAnnouncement } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import type { AnnouncementType } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/[propertyHash]/announcements/[id]
 * Update an existing announcement for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
) {
  try {
    const { propertyHash, id } = await params;

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

    if (!validateSessionToken(token, property.id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or missing session token' },
        { status: 401 }
      );
    }

    const announcementId = parseInt(id, 10);
    const body = await request.json();

    // Build update object
    const updates: Parameters<typeof updateAnnouncement>[2] = {};

    if (body.type !== undefined) {
      const validTypes: AnnouncementType[] = ['warning', 'info', 'alert'];
      if (!validTypes.includes(body.type as AnnouncementType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid announcement type' },
          { status: 400 }
        );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating announcement:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/[propertyHash]/announcements/[id]
 * Delete an announcement for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string; id: string }> }
) {
  try {
    const { propertyHash, id } = await params;

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

    if (!validateSessionToken(token, property.id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or missing session token' },
        { status: 401 }
      );
    }

    const announcementId = parseInt(id, 10);

    // deleteAnnouncement verifies ownership internally
    await deleteAnnouncement(announcementId, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
