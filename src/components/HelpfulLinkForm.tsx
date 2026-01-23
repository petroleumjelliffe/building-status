'use client';

import { useState } from 'react';
import type { HelpfulLink } from '@/types';

interface HelpfulLinkFormProps {
  link?: HelpfulLink; // If provided, we're editing; otherwise creating
  sessionToken: string;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Form for creating or editing helpful links
 * Used within Modal component
 */
export function HelpfulLinkForm({ link, sessionToken, onSubmit, onCancel }: HelpfulLinkFormProps) {
  const [title, setTitle] = useState(link?.title || '');
  const [url, setUrl] = useState(link?.url || '');
  const [icon, setIcon] = useState(link?.icon || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const apiUrl = link
        ? `/api/helpful-links/${link.id}`
        : '/api/helpful-links';

      const method = link ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ title, url, icon }),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save link');
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
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input
          id="title"
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Building Portal"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="url" className="form-label">
          URL
        </label>
        <input
          id="url"
          type="url"
          className="form-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. https://example.com"
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
          placeholder="e.g. 🏠"
          maxLength={2}
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
          {isSubmitting ? 'Saving...' : (link ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
}
