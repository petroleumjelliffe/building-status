'use client';

import { useState } from 'react';
import { buildApiUrl } from '@/lib/api';

interface SettingsFormProps {
  reportEmail: string;
  sessionToken: string;
  onSubmit: () => void;
  onCancel: () => void;
  propertyHash?: string;
}

/**
 * Form for editing site settings (report email)
 * Used within Modal component
 */
export function SettingsForm({ reportEmail, sessionToken, onSubmit, onCancel, propertyHash }: SettingsFormProps) {
  const [email, setEmail] = useState(reportEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Use property-scoped route if propertyHash available, otherwise fall back to legacy
      const url = propertyHash
        ? buildApiUrl(propertyHash, '/settings')
        : '/api/settings';

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          reportEmail: email,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="reportEmail">
          Report Email
          <span className="required">*</span>
        </label>
        <input
          id="reportEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your-email@example.com"
        />
        <small className="form-help">
          Email address for residents to report issues when not logged in
        </small>
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
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
