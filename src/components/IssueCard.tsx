'use client';

import { useState } from 'react';
import type { Issue } from '@/types';
import { Modal } from './Modal';
import { IssueForm } from './IssueForm';

interface IssueCardProps {
  issue: Issue;
  editable?: boolean;
  password?: string;
  onUpdate?: () => void;
}

/**
 * IssueCard component - displays current issue
 * In edit mode, shows edit and resolve buttons
 */
export function IssueCard({ issue, editable, password, onUpdate }: IssueCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    if (!password || !confirm('Mark this issue as resolved?')) return;

    setIsResolving(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onUpdate?.();
      } else {
        const data = await response.json();
        alert('Failed to resolve issue: ' + data.error);
      }
    } catch (error) {
      console.error('Error resolving issue:', error);
      alert('Error resolving issue');
    } finally {
      setIsResolving(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onUpdate?.();
  };

  return (
    <>
      <div className="issue-card">
        <div className="issue-header">
          {issue.icon && <span className="issue-icon">{issue.icon}</span>}
          <div className="issue-title">
            <h3>{issue.category}</h3>
            <span className="issue-location">{issue.location}</span>
          </div>
          <span className={`issue-status status-${issue.status}`}>
            {issue.status}
          </span>
        </div>
        <p className="issue-detail">{issue.detail}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <time className="issue-time">
            Reported {new Date(issue.reportedAt).toLocaleDateString()}
          </time>
          {editable && password && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-icon"
                onClick={() => setIsEditModalOpen(true)}
                title="Edit issue"
              >
                ✏️
              </button>
              <button
                className="btn-icon"
                onClick={handleResolve}
                disabled={isResolving}
                title="Mark as resolved"
              >
                {isResolving ? '⏳' : '✓'}
              </button>
            </div>
          )}
        </div>
      </div>

      {editable && password && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Issue"
        >
          <IssueForm
            issue={issue}
            password={password}
            onSubmit={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
