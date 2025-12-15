interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'tension' | 'domain' | 'excluded' | 'modality';
  size?: 'sm' | 'md';
  className?: string;
}

export function Chip({ children, variant = 'default', size = 'sm', className = '' }: ChipProps) {
  const variants = {
    default: 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)]',
    tension: 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]',
    domain: 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]',
    excluded: 'bg-[var(--color-border-warning)]/20 text-[var(--color-border-warning)]',
    modality: 'bg-[var(--color-accent-purple)]/20 text-[var(--color-accent-purple)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

interface ModalityChipProps {
  type: 'text' | 'voice' | 'video' | 'document';
}

export function ModalityChip({ type }: ModalityChipProps) {
  const icons = {
    text: '📝',
    voice: '🎤',
    video: '📹',
    document: '📄',
  };

  return (
    <Chip variant="modality" size="sm">
      <span className="mr-1">{icons[type]}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Chip>
  );
}
