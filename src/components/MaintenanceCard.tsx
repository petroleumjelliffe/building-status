'use client';

import { useState } from 'react';
import type { Maintenance } from '@/types';
import { Card } from './Card';
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
          'Authorization': `Bearer ${password}`, // password is actually sessionToken
        },
        body: JSON.stringify({}),
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

  // Action buttons for edit mode
  const actions = editable && password ? (
    <>
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
    </>
  ) : undefined;

  return (
    <>
      <Card
        variant="maintenance"
        editable={editable}
        actions={actions}
      >
        <div className="maintenance-date">{maintenance.date}</div>
        <div className="maintenance-desc">{maintenance.description}</div>
      </Card>

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
