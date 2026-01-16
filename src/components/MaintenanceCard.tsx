'use client';

import { useState } from 'react';
import type { Maintenance } from '@/types';
import { Modal } from './Modal';
import { MaintenanceForm } from './MaintenanceForm';

interface MaintenanceCardProps {
  maintenance: Maintenance;
  editable?: boolean;
  password?: string;
  onUpdate?: () => void;
}

/**
 * MaintenanceCard component - displays scheduled maintenance
 * In edit mode, shows edit and complete buttons
 */
export function MaintenanceCard({ maintenance, editable, password, onUpdate }: MaintenanceCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!password || !confirm('Mark this maintenance as completed?')) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/maintenance/${maintenance.id}/complete`, {
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
        alert('Failed to complete maintenance: ' + data.error);
      }
    } catch (error) {
      console.error('Error completing maintenance:', error);
      alert('Error completing maintenance');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onUpdate?.();
  };

  return (
    <>
      <div className="maintenance-card">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div className="maintenance-date">{maintenance.date}</div>
            <div className="maintenance-desc">{maintenance.description}</div>
          </div>
          {editable && password && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-icon"
                onClick={() => setIsEditModalOpen(true)}
                title="Edit maintenance"
              >
                ✏️
              </button>
              <button
                className="btn-icon"
                onClick={handleComplete}
                disabled={isCompleting}
                title="Mark as completed"
              >
                {isCompleting ? '⏳' : '✓'}
              </button>
            </div>
          )}
        </div>
      </div>

      {editable && password && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Maintenance"
        >
          <MaintenanceForm
            maintenance={maintenance}
            password={password}
            onSubmit={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
