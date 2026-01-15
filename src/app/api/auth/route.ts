import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';

/**
 * POST /api/auth
 * Verifies the editor password
 *
 * Body: { password: string }
 * Returns: { success: boolean, valid: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is required',
        },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password);

    return NextResponse.json({
      success: true,
      valid: isValid,
    });
  } catch (error) {
    console.error('Error verifying password:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify password',
      },
      { status: 500 }
    );
  }
}
