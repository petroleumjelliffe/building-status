import type { Contact } from '@/types';

interface ContactCardProps {
  contact: Contact;
}

/**
 * ContactCard component - displays emergency contact information
 */
export function ContactCard({ contact }: ContactCardProps) {
  return (
    <div className="contact-card">
      <div className="contact-label">{contact.label}</div>
      <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="contact-phone">
        {contact.phone}
      </a>
      <div className="contact-hours">{contact.hours}</div>
    </div>
  );
}
