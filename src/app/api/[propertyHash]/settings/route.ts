import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateReportEmail } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/[propertyHash]/settings
 * Update site settings (report email) for a property
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(
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

    const body = await request.json();
    const { reportEmail } = body;

    // Validate required fields
    if (!reportEmail || typeof reportEmail !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid reportEmail' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reportEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Update report email with propertyId
    await updateReportEmail(reportEmail, property.id);

    // Revalidate the status page for this property
    revalidatePath(`/${propertyHash}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
