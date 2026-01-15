import { getStatusData } from '@/lib/queries';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function StatusPage() {
  // This will be populated with actual data later
  // For now, return a placeholder to allow the app to build

  return (
    <div className="container">
      <header>
        <h1>Building Status</h1>
        <div className="updated">Updated Jan 15, 2026 • 2:45 PM</div>
      </header>

      <div className="section">
        <div className="section-header">Systems</div>
        <div className="status-row">
          <div className="status-pill ok">
            <span className="status-icon">🔥</span>
            <span className="status-label">Heat</span>
            <span className="status-count">3/3</span>
          </div>
          <div className="status-pill ok">
            <span className="status-icon">💧</span>
            <span className="status-label">Water</span>
            <span className="status-count">3/3</span>
          </div>
          <div className="status-pill ok">
            <span className="status-icon">🧺</span>
            <span className="status-label">Laundry</span>
            <span className="status-count">3/3</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">Current Issues</div>
        <div className="all-clear">
          <div className="all-clear-icon">✓</div>
          <div className="all-clear-text">No issues reported</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">Scheduled Maintenance</div>
        <div className="all-clear">
          <div className="all-clear-text">No scheduled maintenance</div>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Next.js migration in progress...
        <br />
        Database integration coming next.
      </p>
    </div>
  );
}
