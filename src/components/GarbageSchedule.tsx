import type { GarbageSchedule as GarbageScheduleType } from '@/types';
import { Card } from './Card';

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
        <Card variant="garbage">
          <div className="garbage-type">🗑️ Trash</div>
          <div className="garbage-days">{schedule.trash.days.join(', ')}</div>
          {schedule.trash.time && (
            <div className="garbage-time">{schedule.trash.time}</div>
          )}
        </Card>

        <Card variant="garbage">
          <div className="garbage-type">♻️ Recycling</div>
          <div className="garbage-days">{schedule.recycling.days.join(', ')}</div>
          {schedule.recycling.time && (
            <div className="garbage-time">{schedule.recycling.time}</div>
          )}
        </Card>
      </div>

      {schedule.notes && (
        <div className="garbage-note">{schedule.notes}</div>
      )}
    </>
  );
}
