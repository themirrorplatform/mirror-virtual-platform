import { Info, AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';

interface BannerProps {
  variant: 'info' | 'warning' | 'critical' | 'success';
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({ variant, children, onDismiss, className = '' }: BannerProps) {
  const variants = {
    info: {
      bg: 'bg-[var(--color-accent-blue)]/10',
      border: 'border-[var(--color-accent-blue)]/30',
      text: 'text-[var(--color-accent-blue)]',
      icon: <Info size={18} />,
    },
    warning: {
      bg: 'bg-[var(--color-border-warning)]/10',
      border: 'border-[var(--color-border-warning)]/30',
      text: 'text-[var(--color-border-warning)]',
      icon: <AlertTriangle size={18} />,
    },
    critical: {
      bg: 'bg-[var(--color-accent-red)]/10',
      border: 'border-[var(--color-accent-red)]/30',
      text: 'text-[var(--color-accent-red)]',
      icon: <AlertCircle size={18} />,
    },
    success: {
      bg: 'bg-[var(--color-accent-green)]/10',
      border: 'border-[var(--color-accent-green)]/30',
      text: 'text-[var(--color-accent-green)]',
      icon: <CheckCircle size={18} />,
    },
  };

  const style = variants[variant];

  return (
    <div className={`rounded-lg border ${style.bg} ${style.border} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={style.text}>
          {style.icon}
        </div>
        <div className="flex-1 text-sm text-[var(--color-text-primary)]">
          {children}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${style.text} hover:opacity-70 transition-opacity`}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
