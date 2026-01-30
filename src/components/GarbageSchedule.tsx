'use client';

import { useState } from 'react';
import type { GarbageSchedule as GarbageScheduleType } from '@/types';
import { Card } from './Card';
import { Modal } from './Modal';
import { GarbageScheduleForm } from './GarbageScheduleForm';

interface GarbageScheduleProps {
  schedule: GarbageScheduleType;
  editable?: boolean;
  sessionToken?: string;
  onUpdate?: () => void;
  propertyHash: string;
}

/**
 * GarbageSchedule component - displays trash and recycling schedule
 * Time is optional and only displayed if present
 * In edit mode, shows edit button
 */
export function GarbageSchedule({ schedule, editable, sessionToken, onUpdate, propertyHash }: GarbageScheduleProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onUpdate?.();
  };

  // Edit button for the entire schedule
  const editButton = editable && sessionToken ? (
    <button
      className="btn-icon"
      onClick={() => setIsEditModalOpen(true)}
      title="Edit schedule"
      style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}
    >
      ✏️
    </button>
  ) : null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        {editButton}
        <div className="garbage-grid">
          <Card variant="garbage">
            <div className="garbage-type">🗑️ Trash</div>
            <div className="garbage-days">{schedule.trash.days.join(', ')}</div>
            {schedule.trash.time && (
              <div className="garbage-time">{schedule.trash.time}</div>
            )}
          </Card>

          <Card variant="garbage">
            <div className="garbage-type">♻️ Recycling & Compost</div>
            <div className="garbage-days">{schedule.recycling.days.join(', ')}</div>
            {schedule.recycling.time && (
              <div className="garbage-time">{schedule.recycling.time}</div>
            )}
          </Card>
        </div>

        {schedule.notes && (
          <div className="garbage-note">{schedule.notes}</div>
        )}
      </div>

      {editable && sessionToken && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Garbage Schedule"
        >
          <GarbageScheduleForm
            schedule={schedule}
            sessionToken={sessionToken}
            onSubmit={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
            propertyHash={propertyHash}
          />
        </Modal>
      )}
    </>
  );
}
