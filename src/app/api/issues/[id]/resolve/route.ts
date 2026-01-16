import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { resolveIssue } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { ResolveIssueRequest } from '@/types';

/**
 * POST /api/issues/[id]/resolve
 * Mark an issue as resolved (soft delete)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: ResolveIssueRequest = await request.json();
    const { password } = body;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Resolve issue
    await resolveIssue(id);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resolving issue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
