import { validateSessionToken } from '@/lib/auth';
import { resolveIssue } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { trackServerEvent } from '@/lib/posthog';
import type { ResolveIssueResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/issues/[id]/resolve
 * Mark an issue as resolved for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {ResolveIssueResponse}
 */
export async function POST(
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

    // resolveIssue verifies ownership internally
    await resolveIssue(issueId, property.id);

    trackServerEvent(request, 'issue_resolved', {
      propertyId: property.id, issueId,
    });

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return successResponse();
  } catch (error) {
    console.error('Error resolving issue:', error);

    // Check for access denied error
    if (error instanceof Error && error.message.includes('access denied')) {
      return ApiErrors.notFound('Issue');
    }

    return ApiErrors.internal();
  }
}
