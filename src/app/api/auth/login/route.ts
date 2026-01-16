import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * POST /api/auth/login
 * Authenticate with password and receive session token
 */
export async function POST(request: Request): Promise<NextResponse<LoginResponse>> {
  try {
    const body: LoginRequest = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Create session (verifies password internally)
    const token = await createSession(password);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
