'use client';

import { useState } from 'react';

interface CalendarSubscribeProps {
  siteUrl: string;
}

/**
 * Calendar subscription widget
 * Provides links to subscribe to the building calendar
 * Now designed to be used within a modal
 */
export function CalendarSubscribe({ siteUrl }: CalendarSubscribeProps) {
  const [copied, setCopied] = useState(false);

  // Build URLs
  const icsUrl = `${siteUrl}/api/calendar.ics`;
  const webcalUrl = icsUrl.replace(/^https?:/, 'webcal:');
  const googleCalUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = icsUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="calendar-subscribe-options">
      <a
        href={webcalUrl}
        className="calendar-option"
      >
        <span className="option-icon">🍎</span>
        <span className="option-text">
          <strong>Apple Calendar</strong>
          <small>Also works with iOS</small>
        </span>
      </a>

      <a
        href={googleCalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="calendar-option"
      >
        <span className="option-icon">📆</span>
        <span className="option-text">
          <strong>Google Calendar</strong>
          <small>Opens in new tab</small>
        </span>
      </a>

      <button
        onClick={handleCopy}
        className="calendar-option"
      >
        <span className="option-icon">{copied ? '✓' : '🔗'}</span>
        <span className="option-text">
          <strong>{copied ? 'Copied!' : 'Copy URL'}</strong>
          <small>For other calendar apps</small>
        </span>
      </button>

      <a
        href={icsUrl}
        download="building-status.ics"
        className="calendar-option"
      >
        <span className="option-icon">⬇️</span>
        <span className="option-text">
          <strong>Download .ics</strong>
          <small>One-time import</small>
        </span>
      </a>
    </div>
  );
}
