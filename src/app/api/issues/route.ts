import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { createIssue } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CreateIssueRequest } from '@/types';

/**
 * POST /api/issues
 * Create a new issue
 */
export async function POST(request: Request) {
  try {
    const body: CreateIssueRequest = await request.json();
    const { password, category, location, detail, status, icon } = body;

    // Verify password
    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

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
