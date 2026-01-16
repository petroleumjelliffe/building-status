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
  const isResolved = issue.resolvedAt !== null;

  const handleResolve = async () => {
    if (!password || !confirm('Mark this issue as resolved?')) return;

    setIsResolving(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`, // password is actually sessionToken
        },
        body: JSON.stringify({}),
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
      <div
        className={`issue-item ${isResolved ? 'resolved' : issue.status === 'investigating' ? 'investigating' : ''}`}
        style={isResolved ? { opacity: 0.6 } : undefined}
      >
        <div className="issue-header">
          <div className="issue-category">
            {issue.icon && <span>{issue.icon} </span>}
            {issue.category} - {issue.location}
          </div>
          <span className={`issue-badge ${isResolved ? 'resolved' : issue.status}`}>
            {isResolved ? 'resolved' : issue.status}
          </span>
        </div>
        <div className="issue-detail">{issue.detail}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div className="issue-meta">
            {isResolved && issue.resolvedAt
              ? `Resolved ${new Date(issue.resolvedAt).toLocaleDateString()}`
              : `Reported ${new Date(issue.reportedAt).toLocaleDateString()}`}
          </div>
          {editable && password && !isResolved && (
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

      {editable && password && !isResolved && (
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
