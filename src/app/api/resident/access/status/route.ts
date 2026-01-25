import { NextRequest, NextResponse } from 'next/server';
import { validateResidentSession } from '@/lib/resident-session';

/**
 * GET /api/resident/access/status
 * Check if the current resident session is valid
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        hasAccess: false,
        error: 'No session token provided',
      });
    }

    const sessionToken = authHeader.substring(7);

    // Validate the session
    const session = await validateResidentSession(sessionToken);

    if (!session) {
      return NextResponse.json({
        hasAccess: false,
        error: 'Invalid or expired session',
      });
    }

    return NextResponse.json({
      hasAccess: true,
      propertyId: session.propertyId,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[API] Error checking session status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
