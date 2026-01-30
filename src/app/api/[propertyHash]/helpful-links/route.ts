import { validateSessionToken } from '@/lib/auth';
import { createHelpfulLink } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { createResponse, ApiErrors } from '@/lib/api-response';
import type { CreateHelpfulLinkRequest, CreateHelpfulLinkResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/helpful-links
 * Create a new helpful link for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {CreateHelpfulLinkResponse}
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

    const body: CreateHelpfulLinkRequest = await request.json();
    const { title, url, icon } = body;

    // Validate required fields
    if (!title || !url || !icon) {
      return ApiErrors.missingFields('title, url, icon');
    }

    // Create helpful link with propertyId
    const id = await createHelpfulLink(title, url, icon, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return createResponse(id);
  } catch (error) {
    console.error('Error creating helpful link:', error);
    return ApiErrors.internal();
  }
}
