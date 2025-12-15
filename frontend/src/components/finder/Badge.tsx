/**
 * Badge - Small labeled indicator
 * Used throughout Finder UI
 */

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'secondary', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]',
    secondary: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]',
    warning: 'bg-[var(--color-border-warning)]/20 text-[var(--color-border-warning)]',
    error: 'bg-[var(--color-border-error)]/20 text-[var(--color-border-error)]',
    success: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
