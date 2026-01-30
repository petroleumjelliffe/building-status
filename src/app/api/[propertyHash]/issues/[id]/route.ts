import { validateSessionToken } from '@/lib/auth';
import { updateIssue } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import type { UpdateIssueResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/[propertyHash]/issues/[id]
 * Update an existing issue for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {UpdateIssueResponse}
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

    const issueId = parseInt(id, 10);
    const body = await request.json();

    // Build update object
    const updates: Parameters<typeof updateIssue>[2] = {};

    if (body.category !== undefined) updates.category = body.category;
    if (body.location !== undefined) updates.location = body.location;
    if (body.detail !== undefined) updates.detail = body.detail;
    if (body.status !== undefined) updates.status = body.status;
    if (body.icon !== undefined) updates.icon = body.icon;

    // updateIssue verifies ownership internally
    await updateIssue(issueId, property.id, updates);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error updating issue:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return ApiErrors.notFound('Issue');
    }

    return ApiErrors.internal();
  }
}
