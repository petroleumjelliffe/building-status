'use client';

import { useState } from 'react';
import type { Issue, IssueStatus } from '@/types';
import { buildApiUrl } from '@/lib/api';

interface IssueFormProps {
  issue?: Issue; // If provided, we're editing; otherwise creating
  password: string;
  onSubmit: () => void;
  onCancel: () => void;
  propertyHash?: string;
}

/**
 * Form for creating or editing issues
 * Used within Modal component
 */
export function IssueForm({ issue, password, onSubmit, onCancel, propertyHash }: IssueFormProps) {
  const [category, setCategory] = useState(issue?.category || '');
  const [location, setLocation] = useState(issue?.location || '');
  const [detail, setDetail] = useState(issue?.detail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Use property-scoped route if propertyHash available, otherwise fall back to legacy
      let url: string;
      let method: string;

      if (propertyHash) {
        url = issue
          ? buildApiUrl(propertyHash, `/issues/${issue.id}`)
          : buildApiUrl(propertyHash, '/issues');
        method = issue ? 'PUT' : 'POST';
      } else {
        url = issue ? `/api/issues/${issue.id}` : '/api/issues';
        method = issue ? 'PUT' : 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`, // password is actually sessionToken
        },
        body: JSON.stringify({
          category,
          location,
          detail,
          status: issue ? undefined : 'reported', // New issues default to 'reported'
        }),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save issue');
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
        <label htmlFor="category" className="form-label">
          Category
        </label>
        <input
          id="category"
          type="text"
          className="form-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Plumbing, Electrical"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="location" className="form-label">
          Location
        </label>
        <input
          id="location"
          type="text"
          className="form-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Building 712, Unit 3A"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="detail" className="form-label">
          Description
        </label>
        <textarea
          id="detail"
          className="form-textarea"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Describe the issue..."
          required
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (issue ? 'Save' : 'Add Issue')}
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
