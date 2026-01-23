import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Section component - consistent wrapper for content areas
 * Provides standard layout with title, optional icon, and action slot
 */
export function Section({ title, icon, action, children, className }: SectionProps) {
  return (
    <div className={`section ${className || ''}`}>
      <div className="section-header">
        {icon && <span style={{ marginRight: '0.5rem' }}>{icon}</span>}
        {title}
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}
