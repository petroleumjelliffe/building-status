import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { getPropertyByHash } from '@/lib/property';

export const dynamic = 'force-dynamic';

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * POST /api/[propertyHash]/auth/login
 * Authenticate with password and receive session token bound to this property
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
): Promise<NextResponse<LoginResponse>> {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const body: LoginRequest = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Create session bound to this property
    const token = await createSession(password, property.id);

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
