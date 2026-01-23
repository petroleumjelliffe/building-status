import { NextResponse } from 'next/server';
import ical, { ICalEventStatus, ICalAlarmType } from 'ical-generator';
import { getUpcomingEvents } from '@/lib/queries';
import type { EventType } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Map event status to iCal status
 */
function mapStatus(status: string | null): ICalEventStatus {
  switch (status) {
    case 'completed':
      return ICalEventStatus.CONFIRMED;
    case 'cancelled':
      return ICalEventStatus.CANCELLED;
    case 'in_progress':
      return ICalEventStatus.CONFIRMED;
    default:
      return ICalEventStatus.TENTATIVE;
  }
}

/**
 * GET /api/calendar.ics
 * Returns an iCal feed of upcoming events
 *
 * Query params:
 * - type: Filter by event type (maintenance, announcement, outage)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');

    // Parse type filter
    let types: EventType[] | undefined;
    if (typeParam && typeParam !== 'all') {
      types = typeParam.split(',') as EventType[];
    }

    // Fetch events from database
    const events = await getUpcomingEvents(types);

    // Create calendar
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const calendar = ical({
      name: 'Building Status - 712 W Cornelia',
      timezone: 'America/New_York',
      prodId: { company: 'Building Status', product: 'Calendar' },
      url: siteUrl,
      ttl: 3600, // Refresh every hour
    });

    // Add events to calendar
    for (const event of events) {
      const icalEvent = calendar.createEvent({
        id: `event-${event.id}@building-status`,
        start: event.startsAt,
        end: event.endsAt || event.startsAt,
        allDay: event.allDay ?? false,
        summary: `${getTypeEmoji(event.type)} ${event.title}`,
        description: event.description || undefined,
        status: mapStatus(event.status),
        url: `${siteUrl}/#event-${event.id}`,
      });

      // Add alarm for events with notification settings
      if (event.notifyBeforeMinutes && event.notifyBeforeMinutes.length > 0) {
        for (const minutes of event.notifyBeforeMinutes) {
          icalEvent.createAlarm({
            type: ICalAlarmType.display,
            trigger: -minutes * 60, // Convert to seconds
            description: `Reminder: ${event.title}`,
          });
        }
      }
    }

    // Generate calendar string
    const calendarString = calendar.toString();

    // Return with proper headers
    return new NextResponse(calendarString, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="building-status.ics"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating calendar feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar feed' },
      { status: 500 }
    );
  }
}

/**
 * Get emoji prefix for event type
 */
function getTypeEmoji(type: string): string {
  switch (type) {
    case 'maintenance':
      return '🔧';
    case 'announcement':
      return '📢';
    case 'outage':
      return '⚠️';
    default:
      return '📅';
  }
}
