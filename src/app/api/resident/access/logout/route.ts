import { NextRequest, NextResponse } from 'next/server';
import { invalidateResidentSession } from '@/lib/resident-session';

/**
 * DELETE /api/resident/access/logout
 * Invalidate a resident session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 400 }
      );
    }

    const sessionToken = authHeader.substring(7);

    // Invalidate the session
    await invalidateResidentSession(sessionToken);

    return NextResponse.json({
      success: true,
      message: 'Session invalidated',
    });
  } catch (error) {
    console.error('[API] Error invalidating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
