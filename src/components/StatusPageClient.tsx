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
  propertyHash?: string; // Property hash from URL (for session management)
  propertyName?: string; // Property name for display
}

/**
 * Client wrapper for the status page with authentication and edit mode
 */
export function StatusPageClient({ data, siteUrl, formattedDate, propertyHash, propertyName }: StatusPageClientProps) {
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
        {/* Sub-header with edit toggle and updated time */}
        <div className="page-subheader">
          <EditToggle
            isLoggedIn={isLoggedIn}
            editMode={editMode}
            onToggle={handleEditToggle}
          />
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
              <a
                href={`mailto:${data.reportEmail}?subject=[Building Status] Issue Report&body=Building:%0A%0AUnit:%0A%0ACategory:%0A%0ADescription:%0A`}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
              >
                Report Issue
              </a>
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
                    locked={!isLoggedIn && !hasResidentAccess}
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
          <Section title="Garbage & Recycling">
            <GarbageSchedule
              schedule={data.garbageSchedule}
              editable={isEditable}
              sessionToken={sessionToken || ''}
              onUpdate={handleUpdate}
            />
          </Section>
        )}

        {/* Helpful Links */}
        <HelpfulLinks
          links={data.helpfulLinks}
          editable={isEditable}
          sessionToken={sessionToken || ''}
          onUpdate={handleUpdate}
        />

        {/* QR Code Management */}
        {isEditable && sessionToken && (
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
        <CalendarSubscribe siteUrl={siteUrl} />
      </Modal>
    </>
  );
}
