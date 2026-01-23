'use client';

import { useState } from 'react';
import type { Contact } from '@/types';

interface ContactFormProps {
  contact?: Contact; // If provided, we're editing; otherwise creating
  sessionToken: string;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Form for creating or editing emergency contacts
 * Used within Modal component
 */
export function ContactForm({ contact, sessionToken, onSubmit, onCancel }: ContactFormProps) {
  const [label, setLabel] = useState(contact?.label || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [hours, setHours] = useState(contact?.hours || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = contact
        ? `/api/contacts/${contact.id}`
        : '/api/contacts';

      const method = contact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ label, phone, hours }),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save contact');
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
        <label htmlFor="label" className="form-label">
          Label
        </label>
        <input
          id="label"
          type="text"
          className="form-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Emergency Maintenance"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          className="form-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. (555) 123-4567"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="hours" className="form-label">
          Hours
        </label>
        <input
          id="hours"
          type="text"
          className="form-input"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="e.g. 24/7 or Mon-Fri 9am-5pm"
          required
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
          {isSubmitting ? 'Saving...' : (contact ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
}
