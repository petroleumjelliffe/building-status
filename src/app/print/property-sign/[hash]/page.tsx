import { notFound } from 'next/navigation';
import { getPropertyByHash } from '@/lib/property';
import { getStatusData } from '@/lib/queries';
import { createQRCodeImage } from '@/lib/qr-code';
import { PrintControls } from '@/components/print/PrintControls';
import './print.css';

// Force static rendering for print pages
export const dynamic = 'force-dynamic';

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
          <div className="sign-header">
            <h1 className="property-name">{property.name}</h1>
            <div className="sign-subtitle">Building Status & Information</div>
          </div>

          {/* QR Code Section */}
          <div className="qr-section">
            <div className="qr-code-container">
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="qr-code"
              />
            </div>
            <div className="qr-instructions">
              <div className="instruction-title">Scan for Quick Access</div>
              <ul className="instruction-list">
                <li>Check building systems status</li>
                <li>Report maintenance issues</li>
                <li>View upcoming events</li>
                <li>Access emergency contacts</li>
              </ul>
              <div className="url-fallback">
                Or visit: <span className="url">{propertyUrl.replace('https://', '').replace('http://', '')}</span>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="info-grid">
            {/* Left Column */}
            <div className="info-column">
              {/* Emergency Contacts */}
              {data.contacts && data.contacts.length > 0 && (
                <div className="info-section">
                  <h2 className="section-title">📞 Emergency Contacts</h2>
                  <div className="contacts-list">
                    {data.contacts.slice(0, 3).map((contact, idx) => (
                      <div key={idx} className="contact-item">
                        <div className="contact-label">{contact.label}</div>
                        {contact.phone && (
                          <div className="contact-phone">{contact.phone}</div>
                        )}
                        {contact.email && (
                          <div className="contact-email">{contact.email}</div>
                        )}
                        {contact.hours && (
                          <div className="contact-hours">{contact.hours}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waste Schedule */}
              {data.garbageSchedule && (
                <div className="info-section">
                  <h2 className="section-title">🗑️ Waste Collection</h2>
                  <div className="waste-schedule">
                    {data.garbageSchedule.trash && (
                      <div className="waste-item">
                        <div className="waste-type">Trash</div>
                        <div className="waste-days">{data.garbageSchedule.trash.days.join(', ')}</div>
                        {data.garbageSchedule.trash.time && (
                          <div className="waste-time">{data.garbageSchedule.trash.time}</div>
                        )}
                      </div>
                    )}
                    {data.garbageSchedule.recycling && (
                      <div className="waste-item">
                        <div className="waste-type">Recycling & Compost</div>
                        <div className="waste-days">{data.garbageSchedule.recycling.days.join(', ')}</div>
                        {data.garbageSchedule.recycling.time && (
                          <div className="waste-time">{data.garbageSchedule.recycling.time}</div>
                        )}
                      </div>
                    )}
                    {data.garbageSchedule.notes && (
                      <div className="waste-notes">{data.garbageSchedule.notes}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="info-column">
              {/* Helpful Links */}
              {data.helpfulLinks && data.helpfulLinks.length > 0 && (
                <div className="info-section">
                  <h2 className="section-title">🔗 Helpful Links</h2>
                  <div className="links-list">
                    {data.helpfulLinks.map((link, idx) => (
                      <div key={idx} className="link-item">
                        <div className="link-icon">{link.icon}</div>
                        <div className="link-content">
                          <div className="link-title">{link.title}</div>
                          <div className="link-url">{link.url.replace('https://', '').replace('http://', '').substring(0, 40)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Tips */}
              <div className="info-section">
                <h2 className="section-title">💡 Quick Tips</h2>
                <ul className="tips-list">
                  <li>Check status page before reporting an issue</li>
                  <li>Subscribe to calendar for event reminders</li>
                  <li>Bookmark the page for quick access</li>
                  {signType === 'fridge' && (
                    <li>Keep this QR code on your fridge for easy reference</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sign-footer">
            <div className="footer-left">
              {signType === 'common' ? (
                <span>📍 Posted in {locationLabel}</span>
              ) : (
                <span>📍 For residents of {property.name}</span>
              )}
            </div>
            <div className="footer-right">
              Generated {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Print Controls - Hidden when printing */}
          <PrintControls />
        </div>
      </body>
    </html>
  );
}
