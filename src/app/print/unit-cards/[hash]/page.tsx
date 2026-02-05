import { notFound } from 'next/navigation';
import { getPropertyByHash } from '@/lib/property';
import { getStatusData } from '@/lib/queries';
import { generatePropertyQRCode } from '@/lib/qr-code';
import { PrintControls } from '@/components/print/PrintControls';
import './print.css';

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

interface UnitCardsPageProps {
  params: {
    hash: string;
  };
  searchParams: {
    units?: string; // comma-separated unit numbers like "1A,1B,2A,2B"
  };
}

export default async function PrintUnitCards({ params, searchParams }: UnitCardsPageProps) {
  const property = await getPropertyByHash(params.hash);

  if (!property) {
    notFound();
  }

  const data = await getStatusData(property.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const propertyUrl = `${baseUrl}/${params.hash}`;

  // Parse units from query params or use default set
  const defaultUnits = ['1A', '1B', '2A', '2B'];
  const unitNumbers = searchParams.units
    ? searchParams.units.split(',').map(u => u.trim())
    : defaultUnits;

  // Only render 4 units per page
  const unitsToRender = unitNumbers.slice(0, 4);

  // Generate a unique QR code per unit (each gets its own access token + short link)
  const unitQRCodes = await Promise.all(
    unitsToRender.map(async (unitNumber) => {
      const result = await generatePropertyQRCode(
        property.id,
        params.hash,
        `Unit ${unitNumber} Card`,
        undefined,
        { campaign: 'unit_card', content: unitNumber, unit: unitNumber }
      );
      return { unitNumber, qrCodeDataUrl: result.qrCodeDataUrl };
    })
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="format-detection" content="telephone=no,email=no,address=no" />
        <title>Unit Cards - {property.name}</title>
      </head>
      <body className="print-body">
        <div className="page">
          {unitQRCodes.map(({ unitNumber, qrCodeDataUrl }) => (
            <article key={unitNumber} className="unit-card">
              {/* Header */}
              <header className="card-header">
                <span className="building-name">{property.name}</span>
                <span className="unit-number">{unitNumber}</span>
              </header>

              {/* QR Section */}
              <section className="qr-section">
                <div className="qr-code-container">
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR Code for Unit ${unitNumber}`}
                    className="qr-code"
                  />
                </div>
                <div className="qr-content">
                  <h2 className="qr-headline">Building Status</h2>
                  <p className="qr-subline">Systems, issues, events, contacts</p>
                  <p className="qr-url">{propertyUrl.replace('https://', '').replace('http://', '')}</p>
                </div>
              </section>

              {/* Info Grid */}
              <div className="info-grid">
                {/* Contacts */}
                <div className="info-row">
                  {data.contacts && data.contacts.slice(0, 2).map((contact, idx) => (
                    <div key={idx} className="info-item">
                      <p className="info-label">{contact.label}</p>
                      {contact.phone && (
                        <p className={`info-value ${idx === 0 ? 'phone' : ''}`}>{contact.phone}</p>
                      )}
                      {contact.hours && idx === 0 && (
                        <p className="info-note">{contact.hours}</p>
                      )}
                      {contact.email && idx === 1 && (
                        <p className="info-note">{contact.email.split('@')[0]}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Board Email */}
                {data.contacts && data.contacts.length > 2 && (
                  <div className="info-item">
                    <p className="info-label">{data.contacts[2].label || 'Board'}</p>
                    <p className="info-value">{data.contacts[2].email || data.contacts[2].phone}</p>
                  </div>
                )}

                {/* Waste Schedule */}
                {data.garbageSchedule && (
                  <section className="waste-section">
                    <p className="waste-label">Waste Collection · {data.garbageSchedule.notes || 'out by 7am'}</p>
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
                        <p className="waste-days">
                          {data.garbageSchedule.recycling ? formatDaysShort(data.garbageSchedule.recycling.days) : 'Fri'}
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Footer */}
              <footer className="card-footer">
                <span>{property.name}</span>
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </footer>
            </article>
          ))}
        </div>

        <PrintControls />
      </body>
    </html>
  );
}
