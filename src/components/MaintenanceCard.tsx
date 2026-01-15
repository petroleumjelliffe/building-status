import type { Maintenance } from '@/types';

interface MaintenanceCardProps {
  maintenance: Maintenance;
}

/**
 * MaintenanceCard component - displays scheduled maintenance
 */
export function MaintenanceCard({ maintenance }: MaintenanceCardProps) {
  return (
    <div className="maintenance-card">
      <div className="maintenance-icon">🛠️</div>
      <div className="maintenance-content">
        <div className="maintenance-date">{maintenance.date}</div>
        <div className="maintenance-description">{maintenance.description}</div>
      </div>
    </div>
  );
}
