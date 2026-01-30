'use client';

import { useState } from 'react';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { IssueCard } from '@/components/IssueCard';
import { EventCard } from '@/components/EventCard';
import { MaintenanceCard } from '@/components/MaintenanceCard';
import { ContactCard } from '@/components/ContactCard';
import { GarbageSchedule } from '@/components/GarbageSchedule';
import { HelpfulLinks } from '@/components/HelpfulLinks';
import type { Issue, CalendarEvent, Maintenance, Contact, GarbageSchedule as GarbageScheduleType, HelpfulLink } from '@/types';

/**
 * Debug page for visualizing all card components in various states
 * Access at: /debug/components
 */
export default function ComponentDebugPage() {
  const [editMode, setEditMode] = useState(false);
  const [sessionToken] = useState('debug-token-12345');
  const debugPropertyHash = 'debug123'; // Debug property hash for testing

  // Sample data for each component type
  const sampleIssues: Issue[] = [
    {
      id: 1,
      category: 'Heat',
      location: 'Building A',
      icon: '🔥',
      status: 'reported',
      detail: 'Boiler not working. Technician scheduled for tomorrow morning.',
      reportedAt: new Date('2026-01-23T10:00:00'),
      resolvedAt: null,
    },
    {
      id: 2,
      category: 'Washer 2',
      location: 'Basement Laundry',
      icon: '🧺',
      status: 'investigating',
      detail: 'Not draining properly. Repair company has been contacted.',
      reportedAt: new Date('2026-01-22T14:30:00'),
      resolvedAt: null,
    },
    {
      id: 3,
      category: 'Water',
      location: 'Building C',
      icon: '💧',
      status: 'resolved',
      detail: 'Low water pressure on 3rd floor. Resolved by plumber.',
      reportedAt: new Date('2026-01-20T09:00:00'),
      resolvedAt: new Date('2026-01-21T15:00:00'),
    },
  ];

  const sampleEvents: CalendarEvent[] = [
    {
      id: 1,
      type: 'maintenance',
      title: 'Annual Fire Extinguisher Inspection',
      description: 'All buildings - please ensure access to all extinguishers',
      startsAt: new Date('2026-01-25T09:00:00'),
      endsAt: new Date('2026-01-25T12:00:00'),
      allDay: false,
      timezone: 'America/New_York',
      status: 'scheduled',
      recurrenceRule: null,
      notifyBeforeMinutes: [1440, 60],
      createdAt: new Date('2026-01-15T10:00:00'),
      updatedAt: new Date('2026-01-15T10:00:00'),
      completedAt: null,
      createdBy: null,
    },
    {
      id: 2,
      type: 'outage',
      title: 'Planned Water Shutoff',
      description: 'Water will be off for pipe repairs',
      startsAt: new Date('2026-01-26T08:00:00'),
      endsAt: new Date('2026-01-26T14:00:00'),
      allDay: false,
      timezone: 'America/New_York',
      status: 'scheduled',
      recurrenceRule: null,
      notifyBeforeMinutes: null,
      createdAt: new Date('2026-01-15T10:00:00'),
      updatedAt: new Date('2026-01-15T10:00:00'),
      completedAt: null,
      createdBy: null,
    },
    {
      id: 3,
      type: 'announcement',
      title: 'Monthly Residents Meeting',
      description: null,
      startsAt: new Date('2026-02-01T00:00:00'),
      endsAt: null,
      allDay: true,
      timezone: 'America/New_York',
      status: 'scheduled',
      recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
      notifyBeforeMinutes: null,
      createdAt: new Date('2026-01-15T10:00:00'),
      updatedAt: new Date('2026-01-15T10:00:00'),
      completedAt: null,
      createdBy: null,
    },
  ];

  const sampleMaintenance: Maintenance[] = [
    {
      id: 1,
      date: 'Thu, Jan 30',
      description: 'Plumber coming to repair Washer 2 drainage issue',
      createdAt: new Date('2026-01-23T10:00:00'),
      completedAt: null,
    },
    {
      id: 2,
      date: 'Fri, Jan 31',
      description: 'HVAC technician inspection - all buildings',
      createdAt: new Date('2026-01-23T10:00:00'),
      completedAt: null,
    },
  ];

  const sampleContacts: Contact[] = [
    {
      id: 'contact-1',
      label: 'Building Manager',
      phone: '555-123-4567',
      email: 'manager@example.com',
      hours: 'Mon-Fri 9am-5pm',
    },
    {
      id: 'contact-2',
      label: 'Emergency Maintenance',
      phone: '555-987-6543',
      hours: '24/7',
    },
    {
      id: 'contact-3',
      label: 'Non-Emergency',
      phone: '555-111-2222',
      hours: 'Mon-Fri 9am-5pm',
    },
  ];

  const sampleGarbageSchedule: GarbageScheduleType = {
    trash: {
      days: ['Tuesday', 'Friday'],
      time: '7:00 AM',
    },
    recycling: {
      days: ['Friday'],
      time: '7:00 AM',
    },
    notes: 'Please set out by 7am on collection day',
  };

  const sampleLinks: HelpfulLink[] = [
    {
      id: 'link-1',
      title: 'Pay Rent Online',
      url: 'https://example.com/rent',
      icon: '💳',
    },
    {
      id: 'link-2',
      title: 'Building Policies',
      url: 'https://example.com/policies',
      icon: '📋',
    },
    {
      id: 'link-3',
      title: 'Maintenance Portal',
      url: 'https://example.com/maintenance',
      icon: '🔧',
    },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>Component Debug Page</h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Visualize all card components in various states
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={editMode}
            onChange={(e) => setEditMode(e.target.checked)}
          />
          <span>Edit Mode (show action buttons)</span>
        </label>
      </div>

      {/* New Base Components */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>New Base Components</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Testing the new Section and Card components with different variants
        </p>

        <Section
          title="Section Component Example"
          icon="🎨"
          action={<button className="btn btn-secondary">+ Add Item</button>}
        >
          <div style={{ marginBottom: '1rem' }}>
            <Card variant="default">
              <div style={{ padding: '0.5rem 0' }}>
                <strong>Default Card</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Basic card with no border accent
                </p>
              </div>
            </Card>

            <Card variant="issue">
              <div style={{ padding: '0.5rem 0' }}>
                <strong>Issue Card</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Red border for reported issues
                </p>
              </div>
            </Card>

            <Card variant="event">
              <div style={{ padding: '0.5rem 0' }}>
                <strong>Event Card</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Yellow border for scheduled events
                </p>
              </div>
            </Card>

            <Card variant="maintenance">
              <div style={{ padding: '0.5rem 0' }}>
                <strong>Maintenance Card</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Yellow border for maintenance items
                </p>
              </div>
            </Card>

            <Card variant="contact">
              <div style={{ padding: '0.5rem 0' }}>
                <strong>Contact Card</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Static card for contact information
                </p>
              </div>
            </Card>

            <Card
              variant="link"
              onClick={() => alert('Link card clicked!')}
            >
              <div style={{ padding: '0.5rem 0' }}>
                <strong>Link Card (clickable)</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Hover and click to see interaction
                </p>
              </div>
            </Card>

            <Card
              variant="issue"
              editable={editMode}
              actions={
                <>
                  <button className="btn-icon" title="Edit">✏️</button>
                  <button className="btn-icon" title="Complete">✓</button>
                </>
              }
            >
              <div style={{ padding: '0.5rem 0' }}>
                <strong>Editable Card</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Toggle edit mode to see action buttons
                </p>
              </div>
            </Card>
          </div>
        </Section>
      </section>

      {/* Issue Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Issue Cards (Existing)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sampleIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              editable={editMode}
              password={editMode ? sessionToken : undefined}
              onUpdate={() => console.log('Issue updated:', issue.id)}
              propertyHash={debugPropertyHash}
            />
          ))}
        </div>
      </section>

      {/* Event Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Event Cards</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sampleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              editable={editMode}
              sessionToken={editMode ? sessionToken : undefined}
              onUpdate={() => console.log('Event updated:', event.id)}
              propertyHash={debugPropertyHash}
            />
          ))}
        </div>
      </section>

      {/* Maintenance Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Maintenance Cards</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sampleMaintenance.map((item) => (
            <MaintenanceCard
              key={item.id}
              maintenance={item}
              editable={editMode}
              password={editMode ? sessionToken : undefined}
              onUpdate={() => console.log('Maintenance updated:', item.id)}
              propertyHash={debugPropertyHash}
            />
          ))}
        </div>
      </section>

      {/* Contact Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Contact Cards</h2>
        <div className="contacts-grid">
          {sampleContacts.map((contact, index) => (
            <ContactCard key={index} contact={contact} propertyHash={debugPropertyHash} />
          ))}
        </div>
      </section>

      {/* Garbage Schedule */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Garbage Schedule</h2>
        <GarbageSchedule schedule={sampleGarbageSchedule} propertyHash={debugPropertyHash} />
      </section>

      {/* Helpful Links */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Helpful Links</h2>
        <HelpfulLinks links={sampleLinks} propertyHash={debugPropertyHash} />
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid #eee' }}>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          Debug page for component development • Not visible in production
        </p>
      </footer>
    </div>
  );
}
