'use client';

import { useState } from 'react';
import type { Issue, IssueStatus } from '@/types';

interface IssueFormProps {
  issue?: Issue; // If provided, we're editing; otherwise creating
  password: string;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Form for creating or editing issues
 * Used within Modal component
 */
export function IssueForm({ issue, password, onSubmit, onCancel }: IssueFormProps) {
  const [category, setCategory] = useState(issue?.category || '');
  const [location, setLocation] = useState(issue?.location || '');
  const [icon, setIcon] = useState(issue?.icon || '');
  const [status, setStatus] = useState<IssueStatus>(issue?.status || 'reported');
  const [detail, setDetail] = useState(issue?.detail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = issue
        ? `/api/issues/${issue.id}`
        : '/api/issues';

      const method = issue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          category,
          location,
          icon: icon || undefined,
          status,
          detail,
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
          Category *
        </label>
        <input
          id="category"
          type="text"
          className="form-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Plumbing, Electrical, HVAC"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="location" className="form-label">
          Location *
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
        <label htmlFor="icon" className="form-label">
          Icon (emoji)
        </label>
        <input
          id="icon"
          type="text"
          className="form-input"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="e.g. 🔧"
          maxLength={10}
        />
      </div>

      <div className="form-group">
        <label htmlFor="status" className="form-label">
          Status *
        </label>
        <select
          id="status"
          className="form-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as IssueStatus)}
          required
        >
          <option value="reported">Reported</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="detail" className="form-label">
          Details *
        </label>
        <textarea
          id="detail"
          className="form-textarea"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Describe the issue in detail..."
          required
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (issue ? 'Update Issue' : 'Create Issue')}
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
