import { notFound } from 'next/navigation';
import { getPropertyByHash } from '@/lib/property';
import { getStatusData } from '@/lib/queries';
import { createQRCodeImage } from '@/lib/qr-code';
import { PrintControls } from '@/components/print/PrintControls';
import './print.css';

// Force static rendering for print pages
export const dynamic = 'force-dynamic';

// Helper function to format days like "Tu / Fr"
function formatDaysShort(days: string[]): string {
  const dayMap: Record<string, string> = {
    'Monday': 'Mon',
    'Tuesday': 'Tu',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };

  return days.map(day => dayMap[day] || day.substring(0, 3)).join(' / ');
}

interface PrintSignPageProps {
  params: {
    hash: string;
  };
  searchParams: {
    type?: 'common' | 'fridge';
    location?: string;
  };
}

export default async function PrintPropertySign({ params, searchParams }: PrintSignPageProps) {
  const property = await getPropertyByHash(params.hash);

  if (!property) {
    notFound();
  }

  const data = await getStatusData(property.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Generate QR code pointing to property page
  const propertyUrl = `${baseUrl}/${params.hash}`;
  const qrCodeDataUrl = await createQRCodeImage(propertyUrl);

  const signType = searchParams.type || 'common';
  const locationLabel = searchParams.location || 'Common Area';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="format-detection" content="telephone=no,email=no,address=no" />
        <title>Print Sign - {property.name}</title>
      </head>
      <body className="print-body">
        <div className="property-sign">
          {/* Header */}
          <header className="sign-header">
            <div className="building-identity">
              <h1 className="property-name">{property.name}</h1>
              <p className="building-address">{property.address || ''}</p>
            </div>
          </header>

          {/* QR Hero Section */}
          <section className="qr-section">
            <div className="qr-code-container">
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="qr-code"
              />
            </div>
            <div className="qr-instructions">
              <h2 className="instruction-title">Building Status</h2>
              <p style={{ fontSize: '11pt', color: 'var(--gray)', lineHeight: 1.4, marginBottom: '0.2in' }}>
                Check system status, report issues, view events, and access emergency contacts.
              </p>
              <p className="url-fallback">
                <span className="url">{propertyUrl.replace('https://', '').replace('http://', '')}</span>
              </p>
              <div style={{ marginTop: '0.2in', fontSize: '10pt', color: 'var(--gray)' }}>
                <span style={{ display: 'inline-block', marginRight: '0.2in' }}>
                  <span style={{ fontWeight: 700, color: 'var(--black)' }}>→ </span>Heat & Water
                </span>
                <span style={{ display: 'inline-block', marginRight: '0.2in' }}>
                  <span style={{ fontWeight: 700, color: 'var(--black)' }}>→ </span>Report Issues
                </span>
                <span style={{ display: 'inline-block', marginRight: '0.2in' }}>
                  <span style={{ fontWeight: 700, color: 'var(--black)' }}>→ </span>Events
                </span>
                <span style={{ display: 'inline-block', marginRight: '0.2in' }}>
                  <span style={{ fontWeight: 700, color: 'var(--black)' }}>→ </span>Contacts
                </span>
              </div>
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="info-grid">
            {/* Left Column */}
            <div className="info-column">
              {/* Emergency Contacts */}
              {data.contacts && data.contacts.length > 0 && (
                <section className="info-section">
                  <h3 className="section-title">Emergency Contacts</h3>
                  <div className="contacts-list">
                    {data.contacts.slice(0, 3).map((contact, idx) => (
                      <div key={idx} className="contact-item">
                        <p className="contact-label">{contact.label}</p>
                        {contact.phone && (
                          <p className="contact-phone">{contact.phone}</p>
                        )}
                        {contact.email && (
                          <p className="contact-email">{contact.email}</p>
                        )}
                        {contact.hours && (
                          <p className="contact-hours">{contact.hours}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Waste Collection */}
              {data.garbageSchedule && (
                <section className="info-section">
                  <h3 className="section-title">Waste Collection</h3>
                  <div className="waste-grid">
                    {data.garbageSchedule.trash && (
                      <div className="waste-item">
                        <p className="waste-type">Trash</p>
                        <p className="waste-days">{formatDaysShort(data.garbageSchedule.trash.days)}</p>
                      </div>
                    )}
                    {data.garbageSchedule.recycling && (
                      <div className="waste-item">
                        <p className="waste-type">Recycle</p>
                        <p className="waste-days">{formatDaysShort(data.garbageSchedule.recycling.days)}</p>
                      </div>
                    )}
                    <div className="waste-item">
                      <p className="waste-type">Compost</p>
                      <p className="waste-days">{data.garbageSchedule.recycling ? formatDaysShort(data.garbageSchedule.recycling.days) : '—'}</p>
                    </div>
                  </div>
                  {data.garbageSchedule.notes && (
                    <p className="waste-notes">{data.garbageSchedule.notes}</p>
                  )}
                </section>
              )}
            </div>

            {/* Right Column */}
            <div className="info-column">
              {/* Quick Links */}
              {data.helpfulLinks && data.helpfulLinks.length > 0 && (
                <section className="info-section">
                  <h3 className="section-title">Quick Links</h3>
                  <div className="links-list">
                    {data.helpfulLinks.map((link, idx) => (
                      <div key={idx} className="link-item">
                        <span className="link-title">{link.title}</span>
                        <span className="link-url">{link.url.replace('https://', '').replace('http://', '')}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Quick Tips */}
              <section className="info-section">
                <h3 className="section-title">Quick Tips</h3>
                <ul className="tips-list">
                  <li>Check status page before reporting an issue</li>
                  <li>Subscribe to calendar for event reminders</li>
                  <li>Bookmark the page for quick access</li>
                  <li>Report issues through the app for faster response</li>
                </ul>
              </section>
            </div>
          </div>

          {/* Footer */}
          <footer className="sign-footer">
            <span className="footer-left">
              {signType === 'common' ? `Posted in ${locationLabel}` : property.address || property.name}
            </span>
            <span className="footer-right">
              Generated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </footer>

          {/* Print Controls - Hidden when printing */}
          <PrintControls />
        </div>
      </body>
    </html>
  );
}
