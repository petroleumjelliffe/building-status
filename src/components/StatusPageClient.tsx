'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { StatusPageData } from '@/types';
import { StatusPill } from './StatusPill';
import { AnnouncementBanner } from './AnnouncementBanner';
import { IssueCard } from './IssueCard';
import { MaintenanceCard } from './MaintenanceCard';
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
import { CalendarSubscribe } from './CalendarSubscribe';
import { EmptyState } from './EmptyState';
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
  const router = useRouter();

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
        .then(data => {
          console.log('[StatusPageClient] Token verification result:', data);
          if (data.valid) {
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

  // editable prop = logged in AND edit mode ON
  const isEditable = isLoggedIn && editMode;

  return (
    <>
      <div className={`container ${editMode ? 'page-container edit-mode' : 'page-container'}`}>
        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <h1>Building Status</h1>
            <div className="header-actions">
              <EditToggle
                isLoggedIn={isLoggedIn}
                editMode={editMode}
                onToggle={handleEditToggle}
              />
              <ShareButton
                url={siteUrl}
                title="Building Status"
                text="Check the current status of our building systems"
              />
              <HamburgerMenu
                isLoggedIn={isLoggedIn}
                onLoginClick={() => setIsLoginModalOpen(true)}
                onLogoutClick={handleLogout}
              />
            </div>
          </div>
          <div className="updated">
            Updated {formattedDate}
          </div>
        </header>

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
        <div className="section">
          <div className="section-header">Systems</div>
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
        </div>

        {/* Current Issues */}
        <div className="section">
          <div className="section-header">
            Current Issues
            {isEditable && sessionToken && (
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddIssueModalOpen(true)}
                style={{ marginLeft: 'auto', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                + Add Issue
              </button>
            )}
          </div>
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
          {/* Report Issue link - visible when not in edit mode */}
          {!isEditable && (
            <a
              href={`mailto:${data.reportEmail}?subject=[Building Status] Issue Report&body=Building:%0A%0AUnit:%0A%0ACategory:%0A%0ADescription:%0A`}
              className="report-issue-link"
            >
              Report an issue
            </a>
          )}
        </div>

        {/* Scheduled Maintenance */}
        <div className="section">
          <div className="section-header">
            Scheduled Maintenance
            {isEditable && sessionToken && (
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddEventModalOpen(true)}
                style={{ marginLeft: 'auto', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                + Add Event
              </button>
            )}
          </div>
          {data.maintenance.length > 0 ? (
            <div className="maintenance-list">
              {data.maintenance.map((item) => (
                <MaintenanceCard
                  key={item.id}
                  maintenance={item}
                  editable={isEditable}
                  password={sessionToken || ''}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No scheduled maintenance" />
          )}
        </div>

        {/* Emergency Contacts */}
        {data.contacts.length > 0 && (
          <div className="section">
            <div className="section-header">📞 Emergency Contacts</div>
            <div className="contacts-grid">
              {data.contacts.map((contact, index) => (
                <ContactCard key={index} contact={contact} />
              ))}
            </div>
          </div>
        )}

        {/* Garbage Schedule */}
        {data.garbageSchedule && (
          <div className="section">
            <div className="section-header">Garbage & Recycling</div>
            <GarbageSchedule schedule={data.garbageSchedule} />
          </div>
        )}

        {/* Helpful Links */}
        {data.helpfulLinks.length > 0 && (
          <div className="section">
            <HelpfulLinks links={data.helpfulLinks} />
          </div>
        )}

        {/* Calendar Subscribe */}
        <CalendarSubscribe siteUrl={siteUrl} />

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

      {/* Add Issue/Event Modals */}
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
        </>
      )}
    </>
  );
}
