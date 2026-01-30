'use client';

import { useState } from 'react';
import type { GarbageSchedule } from '@/types';
import { buildApiUrl } from '@/lib/api';

interface GarbageScheduleFormProps {
  schedule: GarbageSchedule;
  sessionToken: string;
  onSubmit: () => void;
  onCancel: () => void;
  propertyHash: string;
}

/**
 * Form for editing garbage and recycling schedule
 * Used within Modal component
 */
export function GarbageScheduleForm({ schedule, sessionToken, onSubmit, onCancel, propertyHash }: GarbageScheduleFormProps) {
  const [trashDays, setTrashDays] = useState(schedule.trash.days.join(', '));
  const [trashTime, setTrashTime] = useState(schedule.trash.time || '');
  const [recyclingDays, setRecyclingDays] = useState(schedule.recycling.days.join(', '));
  const [recyclingTime, setRecyclingTime] = useState(schedule.recycling.time || '');
  const [notes, setNotes] = useState(schedule.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Parse comma-separated days into arrays
      const parseDays = (daysString: string) =>
        daysString.split(',').map(day => day.trim()).filter(day => day.length > 0);

      const url = buildApiUrl(propertyHash, '/garbage-schedule');

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          trash: {
            days: parseDays(trashDays),
            time: trashTime || undefined,
          },
          recycling: {
            days: parseDays(recyclingDays),
            time: recyclingTime || undefined,
          },
          notes,
        }),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update schedule');
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

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Trash Pickup</h3>

        <div className="form-group">
          <label htmlFor="trash-days" className="form-label">
            Days (comma-separated)
          </label>
          <input
            id="trash-days"
            type="text"
            className="form-input"
            value={trashDays}
            onChange={(e) => setTrashDays(e.target.value)}
            placeholder="e.g. Monday, Wednesday, Friday"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="trash-time" className="form-label">
            Time (optional)
          </label>
          <input
            id="trash-time"
            type="text"
            className="form-input"
            value={trashTime}
            onChange={(e) => setTrashTime(e.target.value)}
            placeholder="e.g. Before 7 AM"
          />
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Recycling Pickup</h3>

        <div className="form-group">
          <label htmlFor="recycling-days" className="form-label">
            Days (comma-separated)
          </label>
          <input
            id="recycling-days"
            type="text"
            className="form-input"
            value={recyclingDays}
            onChange={(e) => setRecyclingDays(e.target.value)}
            placeholder="e.g. Tuesday, Thursday"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="recycling-time" className="form-label">
            Time (optional)
          </label>
          <input
            id="recycling-time"
            type="text"
            className="form-input"
            value={recyclingTime}
            onChange={(e) => setRecyclingTime(e.target.value)}
            placeholder="e.g. Before 7 AM"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes" className="form-label">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Place bins at curb"
          rows={3}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Update Schedule'}
        </button>
      </div>
    </form>
  );
}
