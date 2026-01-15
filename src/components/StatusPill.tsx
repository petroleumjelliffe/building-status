'use client';

import type { SystemStatus } from '@/types';

interface StatusPillProps {
  systemId: string;
  status: SystemStatus;
  count: string | null;
  icon: string;
  label: string;
  editable: boolean;
  password?: string;
  onUpdate?: () => void;
}

/**
 * StatusPill component with tap-to-cycle functionality in edit mode
 * Cycles: ok → issue → down → ok
 */
export function StatusPill({
  systemId,
  status,
  count,
  icon,
  label,
  editable,
  password,
  onUpdate,
}: StatusPillProps) {
  const handleClick = async () => {
    if (!editable || !password) return;

    // Cycle to next status
    const nextStatus: SystemStatus =
      status === 'ok' ? 'issue' : status === 'issue' ? 'down' : 'ok';

    try {
      const response = await fetch('/api/status/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          systemId,
          status: nextStatus,
          count,
        }),
      });

      if (response.ok) {
        // Trigger parent component refresh
        onUpdate?.();
      } else {
        const data = await response.json();
        console.error('Failed to update status:', data.error);
        alert('Failed to update status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  return (
    <div
      className={`status-pill ${status} ${editable ? 'editable' : ''}`}
      onClick={handleClick}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={(e) => {
        if (editable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      title={editable ? `Click to cycle status (current: ${status})` : undefined}
    >
      <span className="status-icon">{icon}</span>
      <span className="status-label">{label}</span>
      {count && <span className="status-count">{count}</span>}
    </div>
  );
}
