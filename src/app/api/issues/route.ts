import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createIssue } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CreateIssueRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/issues
 * Create a new issue
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

    const body: CreateIssueRequest = await request.json();
    const { category, location, detail, status, icon } = body;

    // Validate required fields
    if (!category || !location || !detail || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create issue
    const id = await createIssue(category, location, detail, status, icon);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
