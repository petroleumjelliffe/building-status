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
    <>
      <div className="garbage-grid">
        <div className="garbage-card">
          <div className="garbage-type">🗑️ Trash</div>
          <div className="garbage-days">{schedule.trash.days.join(', ')}</div>
          {schedule.trash.time && (
            <div className="garbage-time">{schedule.trash.time}</div>
          )}
        </div>

        <div className="garbage-card">
          <div className="garbage-type">♻️ Recycling</div>
          <div className="garbage-days">{schedule.recycling.days.join(', ')}</div>
          {schedule.recycling.time && (
            <div className="garbage-time">{schedule.recycling.time}</div>
          )}
        </div>
      </div>

      {schedule.notes && (
        <div className="garbage-note">{schedule.notes}</div>
      )}
    </>
  );
}
