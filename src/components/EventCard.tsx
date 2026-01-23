'use client';

import { useState } from 'react';
import type { CalendarEvent } from '@/types';
import { Modal } from './Modal';
import { EventForm } from './EventForm';

interface EventCardProps {
  event: CalendarEvent;
  editable?: boolean;
  sessionToken?: string;
  onUpdate?: () => void;
}

/**
 * Format event date/time for display
 */
function formatEventDateTime(event: CalendarEvent): string {
  const startsAt = new Date(event.startsAt);

  if (event.allDay) {
    return startsAt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  const dateStr = startsAt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = startsAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (event.endsAt) {
    const endsAt = new Date(event.endsAt);
    const endTimeStr = endsAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr}, ${timeStr} - ${endTimeStr}`;
  }

  return `${dateStr}, ${timeStr}`;
}

/**
 * Get display icon for event type
 */
function getEventTypeIcon(type: string): string {
  switch (type) {
    case 'maintenance': return '🔧';
    case 'outage': return '⚠️';
    case 'announcement': return '📢';
    default: return '📅';
  }
}

/**
 * EventCard component - displays a calendar event
 * In edit mode, shows edit and complete/cancel buttons
 */
export function EventCard({ event, editable, sessionToken, onUpdate }: EventCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!sessionToken || !confirm('Mark this event as completed?')) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        onUpdate?.();
      } else {
        const data = await response.json();
        alert('Failed to complete event: ' + data.error);
      }
    } catch (error) {
      console.error('Error completing event:', error);
      alert('Error completing event');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onUpdate?.();
  };

  const isRecurring = !!event.recurrenceRule;

  return (
    <>
      <div className="event-card">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className="event-icon">{getEventTypeIcon(event.type)}</div>
          <div style={{ flex: 1 }}>
            <div className="event-datetime">
              {formatEventDateTime(event)}
              {isRecurring && <span className="event-recurring" title="Recurring event">🔄</span>}
            </div>
            <div className="event-title">{event.title}</div>
            {event.description && (
              <div className="event-description">{event.description}</div>
            )}
          </div>
          {editable && sessionToken && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-icon"
                onClick={() => setIsEditModalOpen(true)}
                title="Edit event"
              >
                ✏️
              </button>
              <button
                className="btn-icon"
                onClick={handleComplete}
                disabled={isCompleting}
                title="Mark as completed"
              >
                {isCompleting ? '⏳' : '✓'}
              </button>
            </div>
          )}
        </div>
      </div>

      {editable && sessionToken && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Event"
        >
          <EventForm
            event={event}
            sessionToken={sessionToken}
            onSubmit={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
