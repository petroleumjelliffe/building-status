import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { updateReportEmail } from '@/lib/queries';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/settings
 * Update site settings (report email)
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(request: Request) {
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

    // Update report email
    await updateReportEmail(reportEmail);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
