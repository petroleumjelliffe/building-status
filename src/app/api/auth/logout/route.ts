import { NextResponse } from 'next/server';
import { revokeSession } from '@/lib/auth';

export interface LogoutResponse {
  success: boolean;
}

/**
 * POST /api/auth/logout
 * Invalidate session token
 * Expects: Authorization: Bearer <token>
 */
export async function POST(request: Request): Promise<NextResponse<LogoutResponse>> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      revokeSession(token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in logout:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
