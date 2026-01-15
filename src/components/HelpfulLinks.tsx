import type { HelpfulLink } from '@/types';

interface HelpfulLinksProps {
  links: HelpfulLink[];
}

/**
 * HelpfulLinks component - displays helpful resource links
 */
export function HelpfulLinks({ links }: HelpfulLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="helpful-links">
      <h3>🔗 Helpful Links</h3>
      <div className="links-grid">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            className="link-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="link-icon">{link.icon}</span>
            <span className="link-title">{link.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
