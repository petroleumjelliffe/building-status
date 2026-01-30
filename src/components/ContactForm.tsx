'use client';

import { useState } from 'react';
import type { Contact } from '@/types';
import { buildApiUrl } from '@/lib/api';

interface ContactFormProps {
  contact?: Contact; // If provided, we're editing; otherwise creating
  sessionToken: string;
  onSubmit: () => void;
  onCancel: () => void;
  propertyHash: string;
}

/**
 * Form for creating or editing emergency contacts
 * Used within Modal component
 */
export function ContactForm({ contact, sessionToken, onSubmit, onCancel, propertyHash }: ContactFormProps) {
  const [label, setLabel] = useState(contact?.label || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [hours, setHours] = useState(contact?.hours || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Format phone number as user types: (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Format based on length
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate that at least one of phone or email is provided
    if (!phone && !email) {
      setError('Please provide at least a phone number or email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = contact
        ? buildApiUrl(propertyHash, `/contacts/${contact.id}`)
        : buildApiUrl(propertyHash, '/contacts');
      const method = contact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          label,
          phone: phone || undefined,
          email: email || undefined,
          hours
        }),
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
          Phone Number (optional)
        </label>
        <input
          id="phone"
          type="tel"
          className="form-input"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(555) 123-4567"
          maxLength={14}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email (optional)
        </label>
        <input
          id="email"
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@example.com"
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          title="Please enter a valid email address"
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
