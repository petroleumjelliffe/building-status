import { NextResponse } from 'next/server';
import ical, { ICalEventStatus, ICalAlarmType } from 'ical-generator';
import { getUpcomingEvents } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { getPostHogClient } from '@/lib/posthog';
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
 * GET /api/[propertyHash]/calendar.ics
 * Returns an iCal feed of upcoming events for a property
 *
 * Query params:
 * - type: Filter by event type (maintenance, announcement, outage)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
) {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');

    // Parse type filter
    let types: EventType[] | undefined;
    if (typeParam && typeParam !== 'all') {
      types = typeParam.split(',') as EventType[];
    }

    // Fetch events from database for this property
    const events = await getUpcomingEvents(property.id, types);

    // Create calendar
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const calendar = ical({
      name: `Building Status - ${property.name}`,
      timezone: 'America/New_York',
      prodId: { company: 'Building Status', product: 'Calendar' },
      url: `${siteUrl}/${propertyHash}`,
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
        url: `${siteUrl}/${propertyHash}#event-${event.id}`,
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

    getPostHogClient().capture({
      distinctId: `property:${property.id}`,
      event: 'calendar_feed_access',
      properties: { propertyId: property.id, typeFilter: typeParam || 'all' },
    });

    // Return with proper headers
    return new NextResponse(calendarString, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${propertyHash}-calendar.ics"`,
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
