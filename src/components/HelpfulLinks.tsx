import type { HelpfulLink } from '@/types';
import { Card } from './Card';

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
          <Card
            key={index}
            variant="link"
            onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
          >
            <span className="link-icon">{link.icon}</span>
            <span className="link-title">{link.title}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
