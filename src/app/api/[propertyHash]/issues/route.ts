import { validateSessionToken } from '@/lib/auth';
import { createIssue } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { createResponse, ApiErrors } from '@/lib/api-response';
import { trackServerEvent } from '@/lib/posthog';
import type { CreateIssueRequest, CreateIssueResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/issues
 * Create a new issue for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {CreateIssueResponse}
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

    const body: CreateIssueRequest = await request.json();
    const { category, location, detail, status, icon } = body;

    // Validate required fields
    if (!category || !location || !detail || !status) {
      return ApiErrors.missingFields('category, location, detail, status');
    }

    // Create issue with propertyId
    const id = await createIssue(property.id, category, location, detail, status, icon);

    trackServerEvent(request, 'Issue Created', {
      propertyId: property.id, category,
    });

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return createResponse(id);
  } catch (error) {
    console.error('Error creating issue:', error);
    return ApiErrors.internal();
  }
}
