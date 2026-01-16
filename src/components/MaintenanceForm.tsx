'use client';

import { useState } from 'react';
import type { Maintenance } from '@/types';

interface MaintenanceFormProps {
  maintenance?: Maintenance; // If provided, we're editing; otherwise creating
  password: string;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Form for creating or editing scheduled maintenance
 * Used within Modal component
 */
export function MaintenanceForm({ maintenance, password, onSubmit, onCancel }: MaintenanceFormProps) {
  const [date, setDate] = useState(maintenance?.date || '');
  const [description, setDescription] = useState(maintenance?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = maintenance
        ? `/api/maintenance/${maintenance.id}`
        : '/api/maintenance';

      const method = maintenance ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          date,
          description,
        }),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save maintenance');
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
        <div style={{ color: 'var(--red)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="date" className="form-label">
          Date *
        </label>
        <input
          id="date"
          type="text"
          className="form-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="e.g. Thu, Jan 16 or Next Tuesday"
          required
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Flexible format - will be displayed exactly as entered
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description *
        </label>
        <textarea
          id="description"
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the scheduled maintenance..."
          required
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (maintenance ? 'Update Maintenance' : 'Create Maintenance')}
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
