'use client';

import { useState } from 'react';
import type { HelpfulLink } from '@/types';
import { Card } from './Card';
import { Section } from './Section';
import { Modal } from './Modal';
import { HelpfulLinkForm } from './HelpfulLinkForm';
import { buildApiUrl } from '@/lib/api';

interface HelpfulLinksProps {
  links: HelpfulLink[];
  editable?: boolean;
  sessionToken?: string;
  onUpdate?: () => void;
  propertyHash: string;
}

/**
 * HelpfulLinks component - displays helpful resource links
 * In edit mode, shows edit/delete buttons per link and add button
 */
export function HelpfulLinks({ links, editable, sessionToken, onUpdate, propertyHash }: HelpfulLinksProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<HelpfulLink | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  if (links.length === 0 && !editable) return null;

  const handleDelete = async (link: HelpfulLink) => {
    if (!sessionToken || !confirm(`Delete link "${link.title}"?`)) return;

    setDeletingLinkId(link.id);
    try {
      const url = buildApiUrl(propertyHash, `/helpful-links/${link.id}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        onUpdate?.();
      } else {
        const data = await response.json();
        alert('Failed to delete link: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Error deleting link');
    } finally {
      setDeletingLinkId(null);
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    onUpdate?.();
  };

  const handleEditSuccess = () => {
    setEditingLink(null);
    onUpdate?.();
  };

  const addButton = editable && sessionToken ? (
    <button
      className="btn btn-secondary"
      onClick={() => setIsAddModalOpen(true)}
      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
    >
      + Add Link
    </button>
  ) : undefined;

  return (
    <>
      <Section title="Helpful Links" icon="🔗" action={addButton}>
        <div className="links-grid">
          {links.map((link) => {
            const actions = editable && sessionToken ? (
              <>
                <button
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingLink(link);
                  }}
                  title="Edit link"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(link);
                  }}
                  disabled={deletingLinkId === link.id}
                  title="Delete link"
                >
                  {deletingLinkId === link.id ? '⏳' : '🗑️'}
                </button>
              </>
            ) : undefined;

            return (
              <Card
                key={link.id}
                variant="link"
                editable={editable}
                actions={actions}
                onClick={!editable ? () => window.open(link.url, '_blank', 'noopener,noreferrer') : undefined}
              >
                <span className="link-icon">{link.icon}</span>
                <span className="link-title">{link.title}</span>
              </Card>
            );
          })}
        </div>
      </Section>

      {editable && sessionToken && (
        <>
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Add Helpful Link"
          >
            <HelpfulLinkForm
              sessionToken={sessionToken}
              onSubmit={handleAddSuccess}
              onCancel={() => setIsAddModalOpen(false)}
              propertyHash={propertyHash}
            />
          </Modal>

          <Modal
            isOpen={!!editingLink}
            onClose={() => setEditingLink(null)}
            title="Edit Helpful Link"
          >
            {editingLink && (
              <HelpfulLinkForm
                link={editingLink}
                sessionToken={sessionToken}
                onSubmit={handleEditSuccess}
                onCancel={() => setEditingLink(null)}
                propertyHash={propertyHash}
              />
            )}
          </Modal>
        </>
      )}
    </>
  );
}
