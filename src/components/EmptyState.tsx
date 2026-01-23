'use client';

interface EmptyStateProps {
  message: string;
}

/**
 * Simple empty state display for sections with no items
 */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-text">{message}</div>
    </div>
  );
}
