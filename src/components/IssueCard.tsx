'use client';

import { useState } from 'react';
import type { Issue } from '@/types';
import { Card } from './Card';
import { Modal } from './Modal';
import { IssueForm } from './IssueForm';
import { buildApiUrl } from '@/lib/api';

interface IssueCardProps {
  issue: Issue;
  editable?: boolean;
  password?: string;
  onUpdate?: () => void;
  propertyHash: string;
}

/**
 * IssueCard component - displays current issue
 * In edit mode, shows edit and resolve buttons
 */
export function IssueCard({ issue, editable, password, onUpdate, propertyHash }: IssueCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const isResolved = issue.resolvedAt !== null;

  const handleResolve = async () => {
    if (!password || !confirm('Mark this issue as resolved?')) return;

    setIsResolving(true);
    try {
      const url = buildApiUrl(propertyHash, `/issues/${issue.id}/resolve`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
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

  // Determine border color based on status
  const getBorderColor = () => {
    if (isResolved) return 'var(--green)';
    if (issue.status === 'investigating') return 'var(--yellow)';
    return 'var(--red)';
  };

  // Action buttons for edit mode
  const actions = editable && password && !isResolved ? (
    <>
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
    </>
  ) : undefined;

  return (
    <>
      <Card
        variant="issue"
        editable={editable && !isResolved}
        actions={actions}
        style={{
          borderLeftColor: getBorderColor(),
          opacity: isResolved ? 0.6 : 1,
        }}
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
        <div className="issue-meta">
          {isResolved && issue.resolvedAt
            ? `Resolved ${new Date(issue.resolvedAt).toLocaleDateString()}`
            : `Reported ${new Date(issue.reportedAt).toLocaleDateString()}`}
        </div>
      </Card>

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
            propertyHash={propertyHash}
          />
        </Modal>
      )}
    </>
  );
}
