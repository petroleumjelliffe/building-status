import { revalidatePath } from 'next/cache';
import { validateSessionToken } from '@/lib/auth';
import { createAnnouncement, updateAnnouncement } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { createResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import type { AnnouncementType, CreateAnnouncementResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/announcements
 * Creates or updates an announcement for a property
 *
 * Headers: Authorization: Bearer <token>
 * Body: {
 *   id?: number,  // If provided, updates existing announcement
 *   type: 'warning' | 'info' | 'alert',
 *   message: string,
 *   expiresAt?: string (ISO date)
 * }
 * @returns {CreateAnnouncementResponse}
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
): Promise<Response> {
  try {
    const { propertyHash } = await params;

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

    const body = await request.json();
    const { id, type, message, expiresAt } = body;

    // Validate inputs
    const validTypes: AnnouncementType[] = ['warning', 'info', 'alert'];
    if (!type || !validTypes.includes(type as AnnouncementType)) {
      return errorResponse('Valid type is required (warning, info, or alert)', 400);
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse('Message is required', 400);
    }

    // Create or update announcement
    let resultId: number;
    if (id && typeof id === 'number') {
      // Update existing announcement with ownership verification
      await updateAnnouncement(id, property.id, {
        type: type as AnnouncementType,
        message,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      resultId = id;
    } else {
      // Create new announcement with propertyId
      resultId = await createAnnouncement(
        property.id,
        type as AnnouncementType,
        message,
        expiresAt ? new Date(expiresAt) : undefined
      );
    }

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return createResponse(resultId);
  } catch (error) {
    console.error('Error managing announcement:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return ApiErrors.notFound('Announcement');
    }

    return ApiErrors.internal();
  }
}
