'use client';

import { useState } from 'react';
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
import { EditModeToggle } from './EditModeToggle';
import { Modal } from './Modal';
import { IssueForm } from './IssueForm';
import { MaintenanceForm } from './MaintenanceForm';

interface StatusPageClientProps {
  data: StatusPageData;
  siteUrl: string;
  formattedDate: string;
}

/**
 * Client wrapper for the status page with edit mode functionality
 */
export function StatusPageClient({ data, siteUrl, formattedDate }: StatusPageClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [password, setPassword] = useState('');
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const router = useRouter();

  const handleEditModeChange = (enabled: boolean, pwd: string) => {
    setIsEditMode(enabled);
    setPassword(pwd);
  };

  const handleUpdate = () => {
    // Refresh the page data
    router.refresh();
  };

  const handleAddIssueSuccess = () => {
    setIsAddIssueModalOpen(false);
    handleUpdate();
  };

  const handleAddMaintenanceSuccess = () => {
    setIsAddMaintenanceModalOpen(false);
    handleUpdate();
  };

  return (
    <>
      <div className="container">
        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <h1>Building Status</h1>
            <div className="header-actions">
              <EditModeToggle onEditModeChange={handleEditModeChange} />
              <ShareButton
                url={siteUrl}
                title="Building Status"
                text="Check the current status of our building systems"
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
            editable={isEditMode}
            password={password}
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
                  editable={isEditMode}
                  password={password}
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
            {isEditMode && password && (
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
                  editable={isEditMode}
                  password={password}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="all-clear">
              <div className="all-clear-icon">✓</div>
              <div className="all-clear-text">No issues reported</div>
            </div>
          )}
        </div>

        {/* Scheduled Maintenance */}
        <div className="section">
          <div className="section-header">
            Scheduled Maintenance
            {isEditMode && password && (
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddMaintenanceModalOpen(true)}
                style={{ marginLeft: 'auto', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                + Add Maintenance
              </button>
            )}
          </div>
          {data.maintenance.length > 0 ? (
            <div className="maintenance-list">
              {data.maintenance.map((item) => (
                <MaintenanceCard
                  key={item.id}
                  maintenance={item}
                  editable={isEditMode}
                  password={password}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="all-clear">
              <div className="all-clear-text">No scheduled maintenance</div>
            </div>
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

        {/* Report Issue */}
        <a
          href={`mailto:${data.reportEmail}?subject=[Building Status] Issue Report&body=Building:%0A%0AUnit:%0A%0ACategory:%0A%0ADescription:%0A`}
          className="share-btn"
          style={{ textDecoration: 'none' }}
        >
          <span className="share-icon">✉️</span>
          Report an Issue
        </a>

        {/* Footer */}
        <footer className="page-footer">
          <p>
            Building status updates are posted as they occur.
            <br />
            For emergencies, contact 911 immediately.
          </p>
        </footer>
      </div>

      {/* Modals */}
      {isEditMode && password && (
        <>
          <Modal
            isOpen={isAddIssueModalOpen}
            onClose={() => setIsAddIssueModalOpen(false)}
            title="Add New Issue"
          >
            <IssueForm
              password={password}
              onSubmit={handleAddIssueSuccess}
              onCancel={() => setIsAddIssueModalOpen(false)}
            />
          </Modal>

          <Modal
            isOpen={isAddMaintenanceModalOpen}
            onClose={() => setIsAddMaintenanceModalOpen(false)}
            title="Add Scheduled Maintenance"
          >
            <MaintenanceForm
              password={password}
              onSubmit={handleAddMaintenanceSuccess}
              onCancel={() => setIsAddMaintenanceModalOpen(false)}
            />
          </Modal>
        </>
      )}
    </>
  );
}
