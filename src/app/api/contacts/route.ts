import { NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';
import { createContact } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import type { CreateContactRequest } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contacts
 * Create a new emergency contact
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

    const body: CreateContactRequest = await request.json();
    const { label, phone, email, hours } = body;

    // Validate required fields
    if (!label || !hours) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that at least one of phone or email is provided
    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: 'At least one of phone or email is required' },
        { status: 400 }
      );
    }

    // Create contact
    const id = await createContact(label, hours, phone, email);

    // Revalidate the status page
    revalidatePath('/');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
