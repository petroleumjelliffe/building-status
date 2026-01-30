import { validateSessionToken } from '@/lib/auth';
import { createContact } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import { createResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import type { CreateContactRequest, CreateContactResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/contacts
 * Create a new emergency contact for a property
 *
 * Headers: Authorization: Bearer <token>
 * @returns {CreateContactResponse}
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

    const body: CreateContactRequest = await request.json();
    const { label, phone, email, hours } = body;

    // Validate required fields
    if (!label || !hours) {
      return ApiErrors.missingFields('label, hours');
    }

    // Validate that at least one of phone or email is provided
    if (!phone && !email) {
      return errorResponse('At least one of phone or email is required', 400);
    }

    // Create contact with propertyId
    const id = await createContact(label, hours, property.id, phone, email);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return createResponse(id);
  } catch (error) {
    console.error('Error creating contact:', error);
    return ApiErrors.internal();
  }
}
