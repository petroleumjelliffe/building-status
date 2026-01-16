import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface VerifyResponse {
  valid: boolean;
}

/**
 * GET /api/auth/verify
 * Verify session token validity
 * Expects: Authorization: Bearer <token>
 */
export async function GET(request: Request): Promise<NextResponse<VerifyResponse>> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const valid = validateSessionToken(token);

    return NextResponse.json({ valid });
  } catch (error) {
    console.error('Error in verify:', error);
    return NextResponse.json({ valid: false });
  }
}
