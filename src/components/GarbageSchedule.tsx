import type { GarbageSchedule as GarbageScheduleType } from '@/types';

interface GarbageScheduleProps {
  schedule: GarbageScheduleType;
}

/**
 * GarbageSchedule component - displays trash and recycling schedule
 * Time is optional and only displayed if present
 */
export function GarbageSchedule({ schedule }: GarbageScheduleProps) {
  return (
    <div className="garbage-schedule">
      <h3>🗑️ Trash & Recycling</h3>

      <div className="schedule-section">
        <div className="schedule-header">
          <span className="schedule-icon">🗑️</span>
          <span className="schedule-type">Trash</span>
        </div>
        <div className="schedule-days">{schedule.trash.days.join(', ')}</div>
        {schedule.trash.time && (
          <div className="schedule-time">{schedule.trash.time}</div>
        )}
      </div>

      <div className="schedule-section">
        <div className="schedule-header">
          <span className="schedule-icon">♻️</span>
          <span className="schedule-type">Recycling</span>
        </div>
        <div className="schedule-days">{schedule.recycling.days.join(', ')}</div>
        {schedule.recycling.time && (
          <div className="schedule-time">{schedule.recycling.time}</div>
        )}
      </div>

      {schedule.notes && (
        <div className="schedule-notes">{schedule.notes}</div>
      )}
    </div>
  );
}
