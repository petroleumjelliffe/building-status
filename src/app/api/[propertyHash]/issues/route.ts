import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createIssue } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';
import type { CreateIssueRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/[propertyHash]/issues
 * Create a new issue for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
) {
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

    // Create issue with propertyId
    const id = await createIssue(property.id, category, location, detail, status, icon);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
