interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-ambient-sm hover:shadow-ambient-md active:shadow-ambient-sm';
  
  const sizeStyles = {
    sm: 'px-5 py-2.5 text-sm rounded-xl',
    md: 'px-6 py-3.5 text-base rounded-xl',
  };
  
  const variantStyles = {
    primary: 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-gold-deep)] active:scale-[0.98]',
    secondary: 'bg-[var(--color-surface-card)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] hover:bg-[var(--color-surface-emphasis)]',
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-emphasis)] shadow-none',
    destructive: 'bg-[var(--color-accent-red)] text-white hover:bg-[#d66060] active:scale-[0.98]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
}