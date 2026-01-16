'use client';

import { useState } from 'react';
import type { SystemStatus } from '@/types';

interface StatusPillProps {
  systemId: string;
  status: SystemStatus;
  count: string | null;
  icon: string;
  label: string;
  editable: boolean;
  password?: string; // sessionToken passed as password prop for now
  onUpdate?: () => void;
}

/**
 * StatusPill component with tap-to-cycle functionality in edit mode
 * Tap to cycle numerator: 0 → 1 → 2 → ... → n → 0
 * Shift+click on count to edit denominator (total)
 */
export function StatusPill({
  systemId,
  status,
  count,
  icon,
  label,
  editable,
  password, // This is actually the sessionToken
  onUpdate,
}: StatusPillProps) {
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [editTotal, setEditTotal] = useState('');
  const handleClick = async (e: React.MouseEvent) => {
    if (!editable || !password) return;

    // If shift+click, enable editing total
    if (e.shiftKey) {
      const [, totalStr] = count ? count.split('/') : ['0', '3'];
      setEditTotal(totalStr);
      setIsEditingTotal(true);
      return;
    }

    // Otherwise, cycle the numerator
    // Parse current count (e.g., "3/3" -> current=3, total=3)
    const [currentStr, totalStr] = count ? count.split('/') : ['0', '3'];
    const current = parseInt(currentStr) || 0;
    const total = parseInt(totalStr) || 3;

    // Cycle numerator: 0 → 1 → 2 → ... → n → 0
    const nextCurrent = current >= total ? 0 : current + 1;
    const nextCount = `${nextCurrent}/${total}`;

    // Derive status from count
    const nextStatus: SystemStatus =
      nextCurrent === total ? 'ok' : nextCurrent === 0 ? 'down' : 'issue';

    try {
      const response = await fetch('/api/status/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`, // password is actually sessionToken
        },
        body: JSON.stringify({
          systemId,
          status: nextStatus,
          count: nextCount,
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

  const handleSaveTotal = async () => {
    if (!editable || !password) return;

    const newTotal = parseInt(editTotal) || 3;
    if (newTotal < 1) {
      alert('Total must be at least 1');
      setIsEditingTotal(false);
      return;
    }

    // Get current numerator and update with new total
    const [currentStr] = count ? count.split('/') : ['0'];
    const current = Math.min(parseInt(currentStr) || 0, newTotal);
    const nextCount = `${current}/${newTotal}`;

    // Derive status from count
    const nextStatus: SystemStatus =
      current === newTotal ? 'ok' : current === 0 ? 'down' : 'issue';

    try {
      const response = await fetch('/api/status/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`, // password is actually sessionToken
        },
        body: JSON.stringify({
          systemId,
          status: nextStatus,
          count: nextCount,
        }),
      });

      if (response.ok) {
        setIsEditingTotal(false);
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
          handleClick(e as any);
        }
      }}
      title={
        editable
          ? `Click to cycle count, Shift+click to edit total (current: ${count || '0/3'})`
          : undefined
      }
    >
      <span className="status-icon">{icon}</span>
      <span className="status-label">{label}</span>
      {count && !isEditingTotal && <span className="status-count">{count}</span>}
      {isEditingTotal && (
        <span className="status-count">
          {count?.split('/')[0]}/
          <input
            type="number"
            min="1"
            value={editTotal}
            onChange={(e) => setEditTotal(e.target.value)}
            onBlur={handleSaveTotal}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveTotal();
              } else if (e.key === 'Escape') {
                setIsEditingTotal(false);
              }
            }}
            style={{
              width: '2em',
              border: '1px solid currentColor',
              borderRadius: '2px',
              background: 'transparent',
              color: 'inherit',
              fontSize: 'inherit',
              textAlign: 'center',
              padding: '0 2px',
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        </span>
      )}
    </div>
  );
}
