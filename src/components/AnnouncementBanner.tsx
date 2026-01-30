'use client';

import { useState } from 'react';
import type { Announcement, AnnouncementType } from '@/types';
import { buildApiUrl } from '@/lib/api';

interface AnnouncementBannerProps {
  announcements: Announcement[];
  editable: boolean;
  password?: string;
  onUpdate?: () => void;
  propertyHash: string;
}

/**
 * AnnouncementBanner component with inline editing
 * - Tap severity badge to cycle: warning → info → alert → warning
 * - Inline contentEditable for message text
 */
export function AnnouncementBanner({
  announcements,
  editable,
  password,
  onUpdate,
  propertyHash,
}: AnnouncementBannerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedMessage, setEditedMessage] = useState('');

  if (announcements.length === 0) return null;

  const cycleSeverity = async (announcement: Announcement) => {
    if (!editable || !password) return;

    const nextType: AnnouncementType =
      announcement.type === 'warning'
        ? 'info'
        : announcement.type === 'info'
        ? 'alert'
        : 'warning';

    try {
      const url = buildApiUrl(propertyHash, `/announcements/${announcement.id}`);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          type: nextType,
          message: announcement.message,
          expiresAt: announcement.expiresAt,
        }),
      });

      if (response.ok) {
        onUpdate?.();
      } else {
        const data = await response.json();
        alert('Failed to update announcement: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Error updating announcement');
    }
  };

  const startEditing = (announcement: Announcement) => {
    if (!editable) return;
    setEditingId(announcement.id);
    setEditedMessage(announcement.message);
  };

  const saveMessage = async (announcement: Announcement) => {
    if (!editable || !password || editedMessage.trim().length === 0) return;

    try {
      const url = buildApiUrl(propertyHash, `/announcements/${announcement.id}`);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          type: announcement.type,
          message: editedMessage,
          expiresAt: announcement.expiresAt,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        onUpdate?.();
      } else {
        const data = await response.json();
        alert('Failed to update announcement: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Error updating announcement');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedMessage('');
  };

  return (
    <div className="announcements-container">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={`announcement ${announcement.type} ${editable ? 'editable' : ''}`}
        >
          <div className="announcement-content">
            {/* Severity badge - tap to cycle */}
            <span
              className={`announcement-severity ${editable ? 'clickable' : ''}`}
              onClick={() => cycleSeverity(announcement)}
              role={editable ? 'button' : undefined}
              tabIndex={editable ? 0 : undefined}
              title={editable ? `Click to cycle severity (current: ${announcement.type})` : undefined}
            >
              {announcement.type === 'warning' && '⚠️'}
              {announcement.type === 'info' && 'ℹ️'}
              {announcement.type === 'alert' && '🚨'}
            </span>

            {/* Message - inline editable */}
            {editingId === announcement.id ? (
              <div className="announcement-edit">
                <input
                  type="text"
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="announcement-input"
                  autoFocus
                />
                <div className="announcement-actions">
                  <button
                    onClick={() => saveMessage(announcement)}
                    className="btn-save"
                  >
                    Save
                  </button>
                  <button onClick={cancelEditing} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <span
                className="announcement-message"
                onClick={() => startEditing(announcement)}
                title={editable ? 'Click to edit message' : undefined}
              >
                {announcement.message}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
