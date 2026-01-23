import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  variant?: 'default' | 'issue' | 'event' | 'maintenance' | 'contact' | 'link' | 'garbage';
  editable?: boolean;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}

/**
 * Card component - base card with flexible content slots
 * Provides consistent card structure with variant-specific styling
 *
 * Variants:
 * - default: No border accent
 * - issue: Red border (or yellow/green based on state)
 * - event: Yellow border
 * - maintenance: Yellow border
 * - contact: No border accent
 * - link: Clickable with hover state
 * - garbage: No border accent
 */
export function Card({
  variant = 'default',
  editable,
  actions,
  className = '',
  children,
  onClick,
  style,
}: CardProps) {
  // Determine border color based on variant
  const getBorderStyle = (): CSSProperties => {
    switch (variant) {
      case 'issue':
        return { borderLeft: '3px solid var(--red)' };
      case 'event':
      case 'maintenance':
        return { borderLeft: '3px solid var(--yellow)' };
      default:
        return {};
    }
  };

  // Clickable cards (links) get hover effects
  const isClickable = variant === 'link' || onClick;

  const cardStyle: CSSProperties = {
    background: 'var(--surface)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.5rem',
    cursor: isClickable ? 'pointer' : undefined,
    transition: isClickable ? 'all 0.15s' : undefined,
    ...getBorderStyle(),
    ...style,
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isClickable) {
      e.currentTarget.style.background = 'var(--surface-hover)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isClickable) {
      e.currentTarget.style.background = 'var(--surface)';
    }
  };

  return (
    <div
      className={`card ${className}`}
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {actions && editable ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>{children}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
