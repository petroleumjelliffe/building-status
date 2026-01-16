import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateSessionToken } from '@/lib/auth';
import { createAnnouncement, updateAnnouncement } from '@/lib/queries';
import type { AnnouncementType } from '@/types';

/**
 * POST /api/announcements
 * Creates or updates an announcement
 *
 * Headers: Authorization: Bearer <token>
 * Body: {
 *   id?: number,  // If provided, updates existing announcement
 *   type: 'warning' | 'info' | 'alert',
 *   message: string,
 *   expiresAt?: string (ISO date)
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateSessionToken(token)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Invalid or missing session token',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, type, message, expiresAt } = body;

    // Validate inputs
    const validTypes: AnnouncementType[] = ['warning', 'info', 'alert'];
    if (!type || !validTypes.includes(type as AnnouncementType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid type is required (warning, info, or alert)',
        },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required',
        },
        { status: 400 }
      );
    }

    // Create or update announcement
    let result;
    if (id && typeof id === 'number') {
      // Update existing announcement
      await updateAnnouncement(id, {
        type: type as AnnouncementType,
        message,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      result = { id };
    } else {
      // Create new announcement
      const newId = await createAnnouncement(
        type as AnnouncementType,
        message,
        expiresAt ? new Date(expiresAt) : undefined
      );
      result = { id: newId };
    }

    // Trigger on-demand revalidation of the home page
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: id ? 'Announcement updated successfully' : 'Announcement created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error managing announcement:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to manage announcement',
      },
      { status: 500 }
    );
  }
}
