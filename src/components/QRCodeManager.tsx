'use client';

import { useState, useEffect } from 'react';

interface QRCode {
  id: number;
  propertyId: number;
  token: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface QRCodeManagerProps {
  sessionToken: string;
  onClose: () => void;
  propertyId: number;
  propertyName: string;
  propertyHash: string;
}

export function QRCodeManager({ sessionToken, onClose, propertyId, propertyName, propertyHash }: QRCodeManagerProps) {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New QR code form state
  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formExpires, setFormExpires] = useState(false);
  const [formExpiresDate, setFormExpiresDate] = useState('');
  const [generating, setGenerating] = useState(false);

  // Generated QR code display
  const [generatedQR, setGeneratedQR] = useState<{
    qrCodeDataUrl: string;
    fullUrl: string;
    label: string;
  } | null>(null);

  // Load QR codes on mount
  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/qr-codes?propertyId=${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch QR codes');
      }

      const data = await response.json();
      setQRCodes(data.qrCodes);
    } catch (err) {
      console.error('[QRCodeManager] Error loading QR codes:', err);
      setError('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQRCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formLabel.trim()) {
      alert('Please enter a label for this QR code');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          propertyId: propertyId,
          label: formLabel.trim(),
          expiresAt: formExpires && formExpiresDate ? new Date(formExpiresDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();

      // Show generated QR code
      setGeneratedQR({
        qrCodeDataUrl: data.qrCodeDataUrl,
        fullUrl: data.fullUrl,
        label: formLabel.trim(),
      });

      // Reset form
      setFormLabel('');
      setFormExpires(false);
      setFormExpiresDate('');
      setShowForm(false);

      // Reload QR codes list
      loadQRCodes();
    } catch (err) {
      console.error('[QRCodeManager] Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleActive = async (qrCodeId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/qr-codes/${qrCodeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle QR code status');
      }

      // Reload QR codes list
      loadQRCodes();
    } catch (err) {
      console.error('[QRCodeManager] Error toggling QR code:', err);
      alert('Failed to toggle QR code status');
    }
  };

  const handleDownloadQRCode = () => {
    if (!generatedQR) return;

    // Create download link
    const link = document.createElement('a');
    link.href = generatedQR.qrCodeDataUrl;
    link.download = `qr-code-${generatedQR.label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    link.click();
  };

  const handleViewQRCode = async (qrCode: QRCode) => {
    try {
      // Regenerate the QR code image
      const response = await fetch(`/api/admin/qr-codes/${qrCode.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate QR code');
      }

      const data = await response.json();

      // Show the regenerated QR code
      setGeneratedQR({
        qrCodeDataUrl: data.qrCodeDataUrl,
        fullUrl: data.fullUrl,
        label: qrCode.label,
      });
    } catch (err) {
      console.error('[QRCodeManager] Error regenerating QR code:', err);
      setError('Failed to regenerate QR code');
    }
  };

  return (
    <div className="qr-code-manager" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>QR Code Management</h2>
        <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Close
        </button>
      </div>

      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Managing QR codes for:</div>
        <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>{propertyName}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : window?.location?.origin || ''}/{propertyHash}
        </div>
      </div>
          {error && (
            <div className="error-message" style={{ color: 'var(--red)', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          {generatedQR && (
            <div className="generated-qr" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>QR Code Generated!</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {generatedQR.label}
              </p>
              <img
                src={generatedQR.qrCodeDataUrl}
                alt="Generated QR Code"
                style={{ maxWidth: '300px', width: '100%', height: 'auto', marginBottom: '1rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg)', borderRadius: '6px' }}>
                {generatedQR.fullUrl}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button onClick={handleDownloadQRCode} className="btn btn-primary">
                  Download QR Code
                </button>
                <button onClick={() => setGeneratedQR(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Existing QR Codes</h3>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem' }}
              >
                + Generate New QR Code
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleGenerateQRCode} style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
              <h4 style={{ marginTop: 0 }}>Generate New QR Code</h4>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="qr-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Label *
                </label>
                <input
                  id="qr-label"
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g., Building A - Main Entrance"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formExpires}
                    onChange={(e) => setFormExpires(e.target.checked)}
                  />
                  <span>Set expiration date</span>
                </label>
              </div>

              {formExpires && (
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="qr-expires" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Expires on
                  </label>
                  <input
                    id="qr-expires"
                    type="date"
                    value={formExpiresDate}
                    onChange={(e) => setFormExpiresDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required={formExpires}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? 'Generating...' : 'Generate QR Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormLabel('');
                    setFormExpires(false);
                    setFormExpiresDate('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading QR codes...</div>
          ) : qrCodes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No QR codes generated yet. Click &quot;Generate New QR Code&quot; to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                      {qr.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Created: {new Date(qr.createdAt).toLocaleDateString()}
                      {qr.expiresAt && ` • Expires: ${new Date(qr.expiresAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleViewQRCode(qr)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      View QR
                    </button>
                    <button
                      onClick={() => handleToggleActive(qr.id, qr.isActive)}
                      className={qr.isActive ? 'btn btn-secondary' : 'btn btn-primary'}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      {qr.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}
