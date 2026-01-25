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
}

/**
 * Client wrapper for the status page with authentication and edit mode
 */
export function StatusPageClient({ data, siteUrl, formattedDate }: StatusPageClientProps) {
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

  // Property-specific state for hash-based routing
  const [propertyHash, setPropertyHash] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<StatusPageData | null>(null);
  const [propertyName, setPropertyName] = useState<string | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);

  // Resident access state (via QR code)
  const [hasResidentAccess, setHasResidentAccess] = useState(false);
  const [residentSessionToken, setResidentSessionToken] = useState<string | null>(null);

  const router = useRouter();

  // Check for ?auth= parameter on mount (QR code scan)
  useEffect(() => {
    const handleAuthToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('auth');
      const hash = window.location.hash.slice(2); // Get property hash

      if (authToken && hash) {
        console.log('[StatusPageClient] Found auth token in URL, validating...');

        try {
          const response = await fetch('/api/resident/access/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken: authToken,
              propertyHash: hash,
            }),
          });

          const result = await response.json();

          if (result.success) {
            console.log('[StatusPageClient] Auth token validated, session created');

            // Store session token in localStorage (property-specific)
            const sessionKey = `resident_session_${hash}`;
            localStorage.setItem(sessionKey, JSON.stringify({
              sessionToken: result.sessionToken,
              propertyId: result.propertyId,
              expiresAt: result.expiresAt,
            }));

            // Update state
            setResidentSessionToken(result.sessionToken);
            setHasResidentAccess(true);

            // Clean URL (remove ?auth= parameter)
            const cleanUrl = `${window.location.pathname}${window.location.hash}`;
            window.history.replaceState({}, '', cleanUrl);
          } else {
            console.error('[StatusPageClient] Auth token validation failed:', result.error);
          }
        } catch (error) {
          console.error('[StatusPageClient] Error validating auth token:', error);
        }
      }
    };

    handleAuthToken();
  }, []);

  // Check for existing resident session on mount and hash changes
  useEffect(() => {
    const checkResidentSession = async () => {
      const hash = window.location.hash.slice(2);
      if (!hash || hash === 'default') return;

      const sessionKey = `resident_session_${hash}`;
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

  // Check for hash-based routing on mount and hash changes
  useEffect(() => {
    const handleHashChange = async () => {
      // Get hash from URL (e.g., /#/abc123)
      const hash = window.location.hash.slice(2); // Remove #/

      if (hash && hash !== 'default') {
        // Fetch property-specific data
        setPropertyHash(hash);
        setIsLoadingProperty(true);

        try {
          const response = await fetch(`/api/property/${hash}`);
          if (response.ok) {
            const result = await response.json();
            setPropertyData(result.data);
            setPropertyName(result.property.name);
          } else {
            console.error('[StatusPageClient] Property not found:', hash);
            // Fall back to default data
            setPropertyHash(null);
            setPropertyData(null);
            setPropertyName(null);
          }
        } catch (error) {
          console.error('[StatusPageClient] Error fetching property data:', error);
          setPropertyHash(null);
          setPropertyData(null);
          setPropertyName(null);
        } finally {
          setIsLoadingProperty(false);
        }
      } else {
        // No hash or 'default' hash - use server-provided data
        setPropertyHash(null);
        setPropertyData(null);
        setPropertyName(null);
        setIsLoadingProperty(false);
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  // Use property-specific data if available, otherwise use server-provided data
  const activeData = propertyData || data;
  const displayTitle = propertyName || 'Building Status';

  // Show loading state while fetching property data
  if (isLoadingProperty) {
    return (
      <div className="container page-container">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p>Loading property activeData...</p>
        </div>
      </div>
    );
  }

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
        {activeData.announcements.length > 0 && (
          <AnnouncementBanner
            announcements={activeData.announcements}
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
            {activeData.systems.map((system) => {
              const statusData = activeData.systemStatus.find(
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
                href={`mailto:${activeData.reportEmail}?subject=[Building Status] Issue Report&body=Building:%0A%0AUnit:%0A%0ACategory:%0A%0ADescription:%0A`}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
              >
                Report Issue
              </a>
            )
          }
        >
          {activeData.issues.length > 0 ? (
            <div className="issues-list">
              {activeData.issues.map((issue) => (
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
          {activeData.events.length > 0 ? (
            <div className="events-list">
              {activeData.events.map((event) => (
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
        {(activeData.contacts.length > 0 || isEditable) && (
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
            {activeData.contacts.length > 0 ? (
              <div className="contacts-grid">
                {activeData.contacts.map((contact) => (
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
        {activeData.garbageSchedule && (
          <Section title="Garbage & Recycling">
            <GarbageSchedule
              schedule={activeData.garbageSchedule}
              editable={isEditable}
              sessionToken={sessionToken || ''}
              onUpdate={handleUpdate}
            />
          </Section>
        )}

        {/* Helpful Links */}
        <HelpfulLinks
          links={activeData.helpfulLinks}
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
              <strong>Report Email:</strong> {activeData.reportEmail}
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
              reportEmail={activeData.reportEmail}
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
