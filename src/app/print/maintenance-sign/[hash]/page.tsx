import { notFound } from 'next/navigation';
import { getPropertyByHash } from '@/lib/property';
import { getStatusData } from '@/lib/queries';
import { createPublicShortLinkQR } from '@/lib/qr-code';
import { PrintControls } from '@/components/print/PrintControls';
import './print.css';

export const dynamic = 'force-dynamic';

interface MaintenanceSignPageProps {
  params: {
    hash: string;
  };
  searchParams: {
    issueId?: string;
  };
}

// Helper to determine badge style and text based on issue status
function getStatusBadge(status: string, category: string) {
  const statusLower = status.toLowerCase();

  if (statusLower === 'resolved') {
    return {
      text: 'Resolved',
      urgent: false,
      note: 'All Clear'
    };
  }

  if (statusLower === 'scheduled' || statusLower === 'upcoming') {
    return {
      text: 'Scheduled',
      urgent: false,
      note: 'Maintenance Window'
    };
  }

  if (statusLower === 'notice' || statusLower === 'announcement') {
    return {
      text: 'Notice',
      urgent: false,
      note: 'Information'
    };
  }

  // Active issues - check if critical
  const isCritical = category === 'critical' || statusLower.includes('outage');
  return {
    text: isCritical ? 'Service Outage' : 'Active Issue',
    urgent: isCritical,
    note: isCritical ? 'Action Required' : 'In Progress'
  };
}

// Format duration like "5h 45m"
function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default async function PrintMaintenanceSign({ params, searchParams }: MaintenanceSignPageProps) {
  const property = await getPropertyByHash(params.hash);

  if (!property) {
    notFound();
  }

  const data = await getStatusData(property.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Find the specific issue or use a default
  const issueId = searchParams.issueId;
  let issue: any = data.maintenance?.[0]; // Default to first issue

  if (issueId && data.maintenance) {
    const found = data.maintenance.find((i: any) => i.id === issueId);
    if (found) issue = found;
  }

  // Transform Maintenance type to have status/category/title fields
  if (issue && !issue.status) {
    // It's a Maintenance type, transform it to match expected format
    issue = {
      ...issue,
      title: issue.description.split(' - ')[0] || issue.description, // Use first part as title
      status: 'scheduled',
      category: 'maintenance',
      details: {
        'Date': issue.date,
        'Description': issue.description,
        'Created': new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    };
  }

  if (!issue) {
    // Create a default "all systems operational" notice
    issue = {
      id: 0,
      title: 'All Systems\nOperational',
      description: 'All building systems are currently functioning normally. Check the building status page for real-time updates.',
      status: 'notice',
      category: 'announcement',
      createdAt: new Date().toISOString(),
      details: {
        'Status': 'All systems online',
        'Last Checked': new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
    };
  }

  const statusBadge = getStatusBadge(issue.status, issue.category);

  // Short link QR code — always points to /{hash} (the property page)
  // Fixes previous bug where /issue/{id} path didn't exist
  const { qrCodeDataUrl, shortUrl } = await createPublicShortLinkQR(
    property.id,
    'maintenance_sign',
    'general',
    issueId ? `Maintenance Sign - Issue #${issueId}` : 'Maintenance Sign - General'
  );
  const issueUrl = `${baseUrl}/${params.hash}`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="format-detection" content="telephone=no,email=no,address=no" />
        <title>Maintenance Sign - {property.name}</title>
      </head>
      <body className="print-body">
        <div className="page">
          {/* Header */}
          <header className="header">
            <span className="building-name">{property.name}</span>
            <div className="header-meta">
              <strong>
                {new Date(issue.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </strong>
              {issue.status === 'scheduled' ? 'Advance Notice' :
               issue.status === 'resolved' ? `Posted ${new Date(issue.resolvedAt || issue.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` :
               `Posted ${new Date(issue.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
            </div>
          </header>

          {/* Status Badge */}
          <div className="status-line">
            <span className={`status-badge ${statusBadge.urgent ? 'urgent' : ''}`}>
              {statusBadge.text}
            </span>
            <span className="status-note">{statusBadge.note}</span>
          </div>

          {/* Main Title */}
          <h1 className="issue-title">
            {issue.title.split('\n').map((line: string, idx: number) => (
              <span key={idx}>
                {line}
                {idx < issue.title.split('\n').length - 1 && <br />}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p className="issue-description">
            {issue.description}
          </p>

          {/* Details Grid */}
          <div className="details-grid">
            {issue.details ? (
              Object.entries(issue.details).map(([label, value], idx) => (
                <div key={idx} className="detail-item">
                  <p className="detail-label">{label}</p>
                  <p className={`detail-value ${idx % 2 === 0 ? 'large' : ''}`}>
                    {String(value)}
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="detail-item">
                  <p className="detail-label">Status</p>
                  <p className="detail-value large">{issue.status}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">Category</p>
                  <p className="detail-value">{issue.category}</p>
                </div>
                {issue.status === 'resolved' && issue.resolvedAt && (
                  <div className="detail-item">
                    <p className="detail-label">Duration</p>
                    <p className="detail-value">
                      {formatDuration(issue.createdAt, issue.resolvedAt)}
                    </p>
                  </div>
                )}
                {data.contacts?.[0] && (
                  <div className="detail-item">
                    <p className="detail-label">Contact</p>
                    <p className="detail-value">
                      {data.contacts[0].label}: {data.contacts[0].phone}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* QR Section */}
          <section className="qr-section">
            <div className="qr-code-container">
              <img
                src={qrCodeDataUrl}
                alt="QR Code for live updates"
                className="qr-code"
              />
            </div>
            <div className="qr-content">
              <h3 className="qr-headline">
                {issue.status === 'resolved' ? 'Report New Issues' :
                 issue.status === 'scheduled' ? 'Add to Calendar' :
                 'Get Live Updates'}
              </h3>
              <p className="qr-subline">
                {issue.status === 'resolved' ? 'If you\'re still experiencing problems, scan to report.' :
                 issue.status === 'scheduled' ? 'Scan to add this maintenance window to your calendar and get reminders.' :
                 'Scan to check current status and receive notification when resolved.'}
              </p>
              <p className="qr-url">{issueUrl.replace('https://', '').replace('http://', '')}</p>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <span>{property.name}</span>
            <span className="issue-id">
              {issueId ? `Issue #${issueId}` : 'Building Notice'}
              {issue.status === 'resolved' && ' – Closed'}
            </span>
          </footer>

          <PrintControls />
        </div>
      </body>
    </html>
  );
}
