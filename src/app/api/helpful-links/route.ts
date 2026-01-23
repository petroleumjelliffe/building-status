import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createHelpfulLink } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CreateHelpfulLinkRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/helpful-links
 * Create a new helpful link
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(request: Request) {
  try {
    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or missing session token' },
        { status: 401 }
      );
    }

    const body: CreateHelpfulLinkRequest = await request.json();
    const { title, url, icon } = body;

    // Validate required fields
    if (!title || !url || !icon) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create helpful link
    const id = await createHelpfulLink(title, url, icon);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating helpful link:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
