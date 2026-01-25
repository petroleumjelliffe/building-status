'use client';

import { useState } from 'react';
import type { Contact } from '@/types';
import { Card } from './Card';
import { Modal } from './Modal';
import { ContactForm } from './ContactForm';
import { LockIcon } from './LockIcon';

interface ContactCardProps {
  contact: Contact;
  editable?: boolean;
  sessionToken?: string;
  onUpdate?: () => void;
  locked?: boolean; // If true, show locked state instead of contact details
}

/**
 * ContactCard component - displays emergency contact information
 * In edit mode, shows edit and delete buttons
 * When locked=true, shows lock icon and message instead of contact details
 */
export function ContactCard({ contact, editable, sessionToken, onUpdate, locked = false }: ContactCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!sessionToken || !confirm(`Delete contact "${contact.label}"?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        onUpdate?.();
      } else {
        const data = await response.json();
        alert('Failed to delete contact: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error deleting contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onUpdate?.();
  };

  // Action buttons for edit mode
  const actions = editable && sessionToken ? (
    <>
      <button
        className="btn-icon"
        onClick={() => setIsEditModalOpen(true)}
        title="Edit contact"
      >
        ✏️
      </button>
      <button
        className="btn-icon"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete contact"
      >
        {isDeleting ? '⏳' : '🗑️'}
      </button>
    </>
  ) : undefined;

  return (
    <>
      <Card variant="contact" editable={editable} actions={actions}>
        <div className="contact-label">{contact.label}</div>
        {locked ? (
          <div className="contact-locked" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            gap: '0.75rem',
            color: 'var(--text-secondary)',
          }}>
            <LockIcon size={32} color="var(--text-secondary)" />
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                Contact information is for residents only
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem' }}>
                Scan the QR code posted in your building to access
              </p>
            </div>
          </div>
        ) : (
          <>
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="contact-phone">
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="contact-phone">
                {contact.email}
              </a>
            )}
          </>
        )}
        <div className="contact-hours">{contact.hours}</div>
      </Card>

      {editable && sessionToken && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Contact"
        >
          <ContactForm
            contact={contact}
            sessionToken={sessionToken}
            onSubmit={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
