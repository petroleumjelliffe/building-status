import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { getPropertyByHash } from '@/lib/property';
import { dataResponse, errorResponse, ApiErrors } from '@/lib/api-response';
import { trackServerEvent, identifyProperty } from '@/lib/posthog';
import type { LoginResponse, LoginSuccessResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/auth/login
 * Authenticate with password and receive session token bound to this property
 * @returns {LoginResponse}
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

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return errorResponse('Password is required', 400);
    }

    // Create session bound to this property
    const token = await createSession(password, property.id);

    if (!token) {
      return errorResponse('Invalid password', 401);
    }

    identifyProperty(request, property.id, property.name);
    trackServerEvent(request, 'Admin Logged In', {
      propertyId: property.id,
    });

    return dataResponse<LoginSuccessResponse>({
      success: true,
      token
    });
  } catch (error) {
    console.error('Error in login:', error);
    return ApiErrors.internal();
  }
}
