'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { StatusPageData } from '@/types';
import { Section } from './Section';
import { StatusPill } from './StatusPill';
import { AnnouncementBanner } from './AnnouncementBanner';
import { IssueCard } from './IssueCard';
import { MaintenanceCard } from './MaintenanceCard';
import { EventCard } from './EventCard';
import { ContactCard } from './ContactCard';
import { GarbageSchedule } from './GarbageSchedule';
import { HelpfulLinks } from './HelpfulLinks';
import { ShareButton } from './ShareButton';
import { EditToggle } from './EditToggle';
import { HamburgerMenu } from './HamburgerMenu';
import { LoginModal } from './LoginModal';
import { Modal } from './Modal';
import { IssueForm } from './IssueForm';
import { MaintenanceForm } from './MaintenanceForm';
import { EventForm } from './EventForm';
import { ContactForm } from './ContactForm';
import { CalendarSubscribe } from './CalendarSubscribe';
import { EmptyState } from './EmptyState';
import { SettingsForm } from './SettingsForm';
import { QRCodeManager } from './QRCodeManager';
import { getSession, clearSession, getEditMode, setEditMode as saveEditMode } from '@/lib/session';

interface StatusPageClientProps {
  data: StatusPageData;
  siteUrl: string;
  formattedDate: string;
  propertyId: number; // Property database ID
  propertyHash: string; // Property hash from URL (for session management)
  propertyName?: string; // Property name for display
  requireAuthForContacts?: boolean; // Whether contact info requires authentication
}

/**
 * Client wrapper for the status page with authentication and edit mode
 */
export function StatusPageClient({
  data,
  siteUrl,
  formattedDate,
  propertyId,
  propertyHash,
  propertyName,
  requireAuthForContacts = false
}: StatusPageClientProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isCalendarSubscribeOpen, setIsCalendarSubscribeOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQRCodeManagerOpen, setIsQRCodeManagerOpen] = useState(false);

  // Resident access state (via QR code)
  const [hasResidentAccess, setHasResidentAccess] = useState(false);
  const [residentSessionToken, setResidentSessionToken] = useState<string | null>(null);

  const router = useRouter();

  // Check for ?auth= parameter on mount (QR code scan)
  useEffect(() => {
    if (!propertyHash) return; // Only process auth for property-specific pages

    const handleAuthToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('auth');

      if (authToken) {
        console.log('[StatusPageClient] Found auth token in URL, storing and redirecting...');

        // Store the auth token temporarily
        sessionStorage.setItem('pending_auth_token', authToken);
        sessionStorage.setItem('pending_auth_hash', propertyHash);

        // Immediately redirect to clean URL
        const cleanUrl = window.location.pathname;
        window.location.replace(cleanUrl);
        return; // Stop execution, page will reload
      }

      // Check for pending auth token from redirect
      const pendingToken = sessionStorage.getItem('pending_auth_token');
      const pendingHash = sessionStorage.getItem('pending_auth_hash');

      if (pendingToken && pendingHash && pendingHash === propertyHash) {
        console.log('[StatusPageClient] Processing pending auth token...');

        // Clear pending items
        sessionStorage.removeItem('pending_auth_token');
        sessionStorage.removeItem('pending_auth_hash');

        try {
          const response = await fetch('/api/resident/access/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken: pendingToken,
              propertyHash: pendingHash,
            }),
          });

          const result = await response.json();

          if (result.success) {
            console.log('[StatusPageClient] Auth token validated, session created');

            // Store session token in localStorage (property-specific)
            const sessionKey = `resident_session_${pendingHash}`;
            localStorage.setItem(sessionKey, JSON.stringify({
              sessionToken: result.sessionToken,
              propertyId: result.propertyId,
              expiresAt: result.expiresAt,
            }));

            // Update state
            setResidentSessionToken(result.sessionToken);
            setHasResidentAccess(true);

            // Reload to show unlocked contacts
            window.location.reload();
          } else {
            console.error('[StatusPageClient] Auth token validation failed:', result.error);
          }
        } catch (error) {
          console.error('[StatusPageClient] Error validating auth token:', error);
        }
      }
    };

    handleAuthToken();
  }, [propertyHash]);

  // Check for existing resident session on mount
  useEffect(() => {
    if (!propertyHash) return; // Only check session for property-specific pages

    const checkResidentSession = async () => {
      const sessionKey = `resident_session_${propertyHash}`;
      const sessionDataStr = localStorage.getItem(sessionKey);

      if (!sessionDataStr) {
        setHasResidentAccess(false);
        setResidentSessionToken(null);
        return;
      }

      try {
        const sessionData = JSON.parse(sessionDataStr);

        // Check expiration client-side first
        if (new Date(sessionData.expiresAt) < new Date()) {
          console.log('[StatusPageClient] Resident session expired');
          localStorage.removeItem(sessionKey);
          setHasResidentAccess(false);
          setResidentSessionToken(null);
          return;
        }

        // Validate with server
        const response = await fetch('/api/resident/access/status', {
          headers: {
            'Authorization': `Bearer ${sessionData.sessionToken}`,
          },
        });

        const result = await response.json();

        if (result.hasAccess) {
          console.log('[StatusPageClient] Resident session valid');
          setResidentSessionToken(sessionData.sessionToken);
          setHasResidentAccess(true);
        } else {
          console.log('[StatusPageClient] Resident session invalid');
          localStorage.removeItem(sessionKey);
          setHasResidentAccess(false);
          setResidentSessionToken(null);
        }
      } catch (error) {
        console.error('[StatusPageClient] Error checking resident session:', error);
        localStorage.removeItem(sessionKey);
        setHasResidentAccess(false);
        setResidentSessionToken(null);
      }
    };

    checkResidentSession();
  }, [propertyHash]);


  // Check for existing session on mount
  useEffect(() => {
    const session = getSession();
    console.log('[StatusPageClient] Session on mount:', session ? {
      tokenPreview: session.token.substring(0, 8) + '...',
      expiresAt: new Date(session.expiresAt).toISOString(),
    } : 'No session');

    if (session) {
      // Verify token with server
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${session.token}` }
      })
        .then(res => res.json())
        .then(authData => {
          console.log('[StatusPageClient] Token verification result:', authData);
          if (authData.valid) {
            setIsLoggedIn(true);
            setSessionToken(session.token);
          } else {
            // Invalid token, clear session
            console.log('[StatusPageClient] Invalid token, clearing session');
            clearSession();
          }
        })
        .catch(error => {
          console.error('[StatusPageClient] Error verifying session:', error);
          clearSession();
        });
    }

    // Edit mode always starts OFF, even if logged in
    setEditMode(false);
  }, []);

  const handleLoginSuccess = (token: string) => {
    console.log('[StatusPageClient] Login successful, token:', token.substring(0, 8) + '...');
    setIsLoggedIn(true);
    setSessionToken(token);
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    if (sessionToken) {
      // Invalidate token on server
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }

    // Clear client-side session
    clearSession();
    setIsLoggedIn(false);
    setSessionToken(null);
    setEditMode(false);
  };

  const handleEditToggle = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    saveEditMode(newEditMode);
  };

  const handleUpdate = () => {
    // Refresh the page data
    router.refresh();
  };

  const handleAddIssueSuccess = () => {
    setIsAddIssueModalOpen(false);
    handleUpdate();
  };

  const handleAddEventSuccess = () => {
    setIsAddEventModalOpen(false);
    handleUpdate();
  };

  const handleAddContactSuccess = () => {
    setIsAddContactModalOpen(false);
    handleUpdate();
  };

  const handleSettingsSuccess = () => {
    setIsSettingsModalOpen(false);
    handleUpdate();
  };

  const handleReportIssue = () => {
    const mailtoUrl = `mailto:${data.reportEmail}?subject=[Building Status] Issue Report&body=Building:%0A%0AUnit:%0A%0ACategory:%0A%0ADescription:%0A`;
    window.location.href = mailtoUrl;
  };

  // editable prop = logged in AND edit mode ON
  const isEditable = isLoggedIn && editMode;

  // Display title: use property name if available, otherwise default
  const displayTitle = propertyName || 'Building Status';

  return (
    <>
      {/* Pinned Title Bar */}
      <div className="title-bar">
        <div className="title-bar-content">
          <h1>{displayTitle}</h1>
          <HamburgerMenu
            isLoggedIn={isLoggedIn}
            onLoginClick={() => setIsLoginModalOpen(true)}
            onLogoutClick={handleLogout}
          />
        </div>
      </div>

      <div className={`container ${editMode ? 'page-container edit-mode' : 'page-container'}`}>
        {/* Sub-header with updated time */}
        <div className="page-subheader">
          <div className="updated">
            Updated {formattedDate}
          </div>
        </div>

        {/* Announcements */}
        {data.announcements.length > 0 && (
          <AnnouncementBanner
            announcements={data.announcements}
            editable={isEditable}
            password={sessionToken || ''}
            onUpdate={handleUpdate}
            propertyHash={propertyHash}
          />
        )}

        {/* System Status */}
        <Section
          title="Systems"
          action={
            <ShareButton
              url={siteUrl}
              title="Building Status"
              text="Check the current status of our building systems"
            />
          }
        >
          <div className="status-row">
            {data.systems.map((system) => {
              const statusData = data.systemStatus.find(
                (s) => s.systemId === system.id
              );
              return (
                <StatusPill
                  key={system.id}
                  systemId={system.id}
                  status={statusData?.status || 'ok'}
                  count={statusData?.count || null}
                  icon={system.icon}
                  label={system.label}
                  editable={isEditable}
                  password={sessionToken || ''}
                  onUpdate={handleUpdate}
                  propertyHash={propertyHash}
                />
              );
            })}
          </div>
        </Section>

        {/* Current Issues */}
        <Section
          title="Current Issues"
          action={
            isEditable && sessionToken ? (
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddIssueModalOpen(true)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                + Add Issue
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={handleReportIssue}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                📝 Report issue
              </button>
            )
          }
        >
          {data.issues.length > 0 ? (
            <div className="issues-list">
              {data.issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  editable={isEditable}
                  password={sessionToken || ''}
                  onUpdate={handleUpdate}
                  propertyHash={propertyHash}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No issues reported" />
          )}
        </Section>

        {/* Upcoming Events */}
        <Section
          title="Upcoming Events"
          action={
            isEditable && sessionToken ? (
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddEventModalOpen(true)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                + Add Event
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => setIsCalendarSubscribeOpen(true)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                📅 Subscribe
              </button>
            )
          }
        >
          {data.events.length > 0 ? (
            <div className="events-list">
              {data.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  editable={isEditable}
                  sessionToken={sessionToken || ''}
                  onUpdate={handleUpdate}
                  propertyHash={propertyHash}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming events" />
          )}
        </Section>

        {/* Emergency Contacts */}
        {(data.contacts.length > 0 || isEditable) && (
          <Section
            title="Emergency Contacts"
            icon="📞"
            action={
              isEditable && sessionToken ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsAddContactModalOpen(true)}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  + Add Contact
                </button>
              ) : undefined
            }
          >
            {data.contacts.length > 0 ? (
              <div className="contacts-grid">
                {data.contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    editable={isEditable}
                    sessionToken={sessionToken || ''}
                    onUpdate={handleUpdate}
                    locked={requireAuthForContacts && !isLoggedIn && !hasResidentAccess}
                    propertyHash={propertyHash}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No emergency contacts" />
            )}
          </Section>
        )}

        {/* Garbage Schedule */}
        {data.garbageSchedule && (
          <Section title="Waste Collection Schedule">
            <GarbageSchedule
              schedule={data.garbageSchedule}
              editable={isEditable}
              sessionToken={sessionToken || ''}
              onUpdate={handleUpdate}
              propertyHash={propertyHash}
            />
          </Section>
        )}

        {/* Helpful Links */}
        <HelpfulLinks
          links={data.helpfulLinks}
          editable={isEditable}
          sessionToken={sessionToken || ''}
          onUpdate={handleUpdate}
          propertyHash={propertyHash}
        />

        {/* QR Code Management */}
        {isEditable && sessionToken && propertyId && propertyHash && (
          <Section
            title="QR Code Access"
            icon="📱"
            action={
              <button
                className="btn btn-primary"
                onClick={() => setIsQRCodeManagerOpen(true)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Manage QR Codes
              </button>
            }
          >
            <div style={{ padding: '0.5rem 0' }}>
              Generate QR codes for resident access to contact information. Post QR codes in your building for residents to scan.
            </div>
          </Section>
        )}

        {/* Print Signs */}
        {isEditable && propertyHash && (
          <Section
            title="Print Signs"
            icon="🖨️"
          >
            <div style={{ padding: '0.5rem 0', marginBottom: '1rem' }}>
              Generate printable signs with QR codes and building information. Monochromatic design optimized for office printers.
            </div>

            {/* Lobby Poster */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Lobby Poster</h4>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                Full-page poster with building info, contacts, waste schedule, and QR code.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const printUrl = `/print/property-sign/${propertyHash}`;
                  window.open(printUrl, '_blank');
                }}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Print Lobby Poster
              </button>
            </div>

            {/* Unit Cards */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Unit Cards</h4>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                Fridge magnets / door cards for residents (4 per page).
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const printUrl = `/print/unit-cards/${propertyHash}?units=1A,1B,2A,2B`;
                    window.open(printUrl, '_blank');
                  }}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Print Sample (1A-2B)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const units = prompt('Enter unit numbers (comma-separated, e.g., "1A,1B,2A,2B"):');
                    if (units) {
                      const printUrl = `/print/unit-cards/${propertyHash}?units=${encodeURIComponent(units)}`;
                      window.open(printUrl, '_blank');
                    }
                  }}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Custom Units
                </button>
              </div>
            </div>

            {/* Maintenance Signs */}
            {data.maintenance && data.maintenance.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Maintenance Signs</h4>
                <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                  Full-page signs for active issues and announcements (72pt headline).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.maintenance.slice(0, 5).map((issue) => (
                    <button
                      key={issue.id}
                      className="btn btn-secondary"
                      onClick={() => {
                        const printUrl = `/print/maintenance-sign/${propertyHash}?issueId=${issue.id}`;
                        window.open(printUrl, '_blank');
                      }}
                      style={{
                        fontSize: '0.875rem',
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{issue.description}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {issue.date}
                      </span>
                    </button>
                  ))}
                  {data.maintenance.length === 0 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const printUrl = `/print/maintenance-sign/${propertyHash}`;
                        window.open(printUrl, '_blank');
                      }}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      Print &quot;All Systems Operational&quot; Sign
                    </button>
                  )}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Settings */}
        {isEditable && (
          <Section
            title="Settings"
            icon="⚙️"
            action={
              <button
                className="btn btn-secondary"
                onClick={() => setIsSettingsModalOpen(true)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Edit
              </button>
            }
          >
            <div style={{ padding: '0.5rem 0' }}>
              <strong>Report Email:</strong> {data.reportEmail}
            </div>
          </Section>
        )}

        {/* Footer */}
        <footer className="page-footer">
          <p>
            Building status updates are posted as they occur.
            <br />
            For emergencies, contact 911 immediately.
          </p>
        </footer>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        propertyHash={propertyHash}
      />

      {/* Add Issue/Event/Contact Modals */}
      {isEditable && sessionToken && (
        <>
          <Modal
            isOpen={isAddIssueModalOpen}
            onClose={() => setIsAddIssueModalOpen(false)}
            title="Add New Issue"
          >
            <IssueForm
              password={sessionToken}
              onSubmit={handleAddIssueSuccess}
              onCancel={() => setIsAddIssueModalOpen(false)}
              propertyHash={propertyHash}
            />
          </Modal>

          <Modal
            isOpen={isAddEventModalOpen}
            onClose={() => setIsAddEventModalOpen(false)}
            title="Add Event"
          >
            <EventForm
              sessionToken={sessionToken}
              onSubmit={handleAddEventSuccess}
              onCancel={() => setIsAddEventModalOpen(false)}
              propertyHash={propertyHash}
            />
          </Modal>

          <Modal
            isOpen={isAddContactModalOpen}
            onClose={() => setIsAddContactModalOpen(false)}
            title="Add Emergency Contact"
          >
            <ContactForm
              sessionToken={sessionToken}
              onSubmit={handleAddContactSuccess}
              onCancel={() => setIsAddContactModalOpen(false)}
              propertyHash={propertyHash}
            />
          </Modal>

          <Modal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            title="Site Settings"
          >
            <SettingsForm
              reportEmail={data.reportEmail}
              sessionToken={sessionToken}
              onSubmit={handleSettingsSuccess}
              onCancel={() => setIsSettingsModalOpen(false)}
              propertyHash={propertyHash}
            />
          </Modal>

          <Modal
            isOpen={isQRCodeManagerOpen}
            onClose={() => setIsQRCodeManagerOpen(false)}
            title=""
          >
            <QRCodeManager
              sessionToken={sessionToken}
              onClose={() => setIsQRCodeManagerOpen(false)}
              propertyId={propertyId!}
              propertyName={propertyName || 'Building Status'}
              propertyHash={propertyHash || ''}
            />
          </Modal>
        </>
      )}

      {/* Calendar Subscribe Modal */}
      <Modal
        isOpen={isCalendarSubscribeOpen}
        onClose={() => setIsCalendarSubscribeOpen(false)}
        title="Subscribe to Calendar"
      >
        <CalendarSubscribe siteUrl={siteUrl} propertyHash={propertyHash} />
      </Modal>

      {/* Pinned Edit Toggle */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 100
      }}>
        <EditToggle
          isLoggedIn={isLoggedIn}
          editMode={editMode}
          onToggle={handleEditToggle}
        />
      </div>
    </>
  );
}
