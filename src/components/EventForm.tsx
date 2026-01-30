'use client';

import { useState } from 'react';
import type { CalendarEvent, EventType } from '@/types';
import { buildApiUrl } from '@/lib/api';

interface EventFormProps {
  event?: CalendarEvent; // If provided, we're editing; otherwise creating
  sessionToken: string;
  onSubmit: () => void;
  onCancel: () => void;
  propertyHash: string;
}

/**
 * Form for creating or editing calendar events
 * Used within Modal component
 */
export function EventForm({ event, sessionToken, onSubmit, onCancel, propertyHash }: EventFormProps) {
  const [type, setType] = useState<EventType>(event?.type || 'maintenance');
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startsAt, setStartsAt] = useState(() => {
    if (event?.startsAt) {
      return formatDateTimeLocal(event.startsAt);
    }
    // Default to tomorrow at 9am
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return formatDateTimeLocal(tomorrow);
  });
  const [endsAt, setEndsAt] = useState(() => {
    if (event?.endsAt) {
      return formatDateTimeLocal(event.endsAt);
    }
    return '';
  });
  const [recurrenceRule, setRecurrenceRule] = useState(event?.recurrenceRule || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = event
        ? buildApiUrl(propertyHash, `/events/${event.id}`)
        : buildApiUrl(propertyHash, '/events');
      const method = event ? 'PATCH' : 'POST';

      // Convert to ISO strings
      const startsAtDate = allDay
        ? new Date(startsAt + 'T00:00:00')
        : new Date(startsAt);

      const payload: Record<string, unknown> = {
        type,
        title,
        description: description || undefined,
        startsAt: startsAtDate.toISOString(),
        allDay,
        recurrenceRule: recurrenceRule || undefined,
      };

      if (endsAt) {
        const endsAtDate = allDay
          ? new Date(endsAt + 'T23:59:59')
          : new Date(endsAt);
        payload.endsAt = endsAtDate.toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save event');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      {error && (
        <div style={{ color: 'var(--red)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="type" className="form-label">
          Event Type
        </label>
        <select
          id="type"
          className="form-input"
          value={type}
          onChange={(e) => setType(e.target.value as EventType)}
          required
        >
          <option value="maintenance">Maintenance</option>
          <option value="announcement">Announcement</option>
          <option value="outage">Outage</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input
          id="title"
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Monthly Exterminator Visit"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description (optional)
        </label>
        <textarea
          id="description"
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details..."
        />
      </div>

      <div className="form-group">
        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <span>All-day event</span>
        </label>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startsAt" className="form-label">
            {allDay ? 'Date' : 'Start Date & Time'}
          </label>
          <input
            id="startsAt"
            type={allDay ? 'date' : 'datetime-local'}
            className="form-input"
            value={allDay ? startsAt.split('T')[0] : startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>

        {!allDay && (
          <div className="form-group">
            <label htmlFor="endsAt" className="form-label">
              End Date & Time (optional)
            </label>
            <input
              id="endsAt"
              type="datetime-local"
              className="form-input"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="recurrence" className="form-label">
          Recurrence (optional)
        </label>
        <select
          id="recurrence"
          className="form-input"
          value={recurrenceRule}
          onChange={(e) => setRecurrenceRule(e.target.value)}
        >
          <option value="">Does not repeat</option>
          <option value="FREQ=WEEKLY">Weekly</option>
          <option value="FREQ=WEEKLY;INTERVAL=2">Every 2 weeks</option>
          <option value="FREQ=MONTHLY">Monthly</option>
          <option value="FREQ=MONTHLY;INTERVAL=3">Every 3 months</option>
          <option value="FREQ=YEARLY">Yearly</option>
        </select>
        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Recurring events will appear in the calendar feed
        </small>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (event ? 'Save' : 'Add Event')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Format a Date object to datetime-local input format
 */
function formatDateTimeLocal(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
