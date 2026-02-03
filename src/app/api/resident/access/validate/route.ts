import { NextRequest, NextResponse } from 'next/server';
import { validateAccessToken } from '@/lib/qr-code';
import { createResidentSession } from '@/lib/resident-session';
import { getPostHogClient } from '@/lib/posthog';

/**
 * POST /api/resident/access/validate
 * Validate an access token and create a resident session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { accessToken, propertyHash } = body;

    if (!accessToken || !propertyHash) {
      return NextResponse.json(
        { error: 'accessToken and propertyHash are required' },
        { status: 400 }
      );
    }

    // Validate the access token
    const validationResult = await validateAccessToken(accessToken, propertyHash);

    if (!validationResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired access token',
        },
        { status: 401 }
      );
    }

    // Create a resident session
    const session = await createResidentSession(
      validationResult.propertyId,
      validationResult.tokenId
    );

    getPostHogClient().capture({
      distinctId: `property:${validationResult.propertyId}`,
      event: 'qr_scan',
      properties: {
        propertyId: validationResult.propertyId,
        accessTokenId: validationResult.tokenId,
      },
    });

    return NextResponse.json({
      success: true,
      sessionToken: session.sessionToken,
      propertyId: validationResult.propertyId,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[API] Error validating access token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
