import { TrendingUp, RefreshCw, TrendingDown, Zap } from 'lucide-react';

type EvolutionType = 'growth' | 'loop' | 'regression' | 'breakthrough';

interface EvolutionBadgeProps {
  type: EvolutionType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const evolutionConfig = {
  growth: {
    color: 'bg-mirror-growth/10 text-mirror-growth border-mirror-growth/30',
    icon: TrendingUp,
    defaultLabel: 'Growth',
    glow: 'shadow-[0_0_20px_rgba(78,212,167,0.3)]',
  },
  loop: {
    color: 'bg-mirror-loop/10 text-mirror-loop border-mirror-loop/30',
    icon: RefreshCw,
    defaultLabel: 'Loop Detected',
    glow: 'shadow-[0_0_20px_rgba(245,166,35,0.3)]',
  },
  regression: {
    color: 'bg-mirror-regression/10 text-mirror-regression border-mirror-regression/30',
    icon: TrendingDown,
    defaultLabel: 'Regression',
    glow: 'shadow-[0_0_20px_rgba(243,93,127,0.3)]',
  },
  breakthrough: {
    color: 'bg-mirror-breakthrough/10 text-mirror-breakthrough border-mirror-breakthrough/30',
    icon: Zap,
    defaultLabel: 'Breakthrough',
    glow: 'shadow-[0_0_20px_rgba(255,215,0,0.4)] animate-pulse-glow',
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs gap-1',
    icon: 12,
  },
  md: {
    container: 'px-3 py-1.5 text-sm gap-1.5',
    icon: 14,
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    icon: 16,
  },
};

export function EvolutionBadge({
  type,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}: EvolutionBadgeProps) {
  const config = evolutionConfig[type];
  const Icon = config.icon;
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={`
        inline-flex items-center rounded-full border font-inter font-medium
        transition-mirror-fast
        ${config.color}
        ${config.glow}
        ${sizeStyles.container}
        ${className}
      `}
      role="status"
      aria-label={`Evolution signal: ${label || config.defaultLabel}`}
    >
      {showIcon && <Icon size={sizeStyles.icon} className="flex-shrink-0" />}
      <span>{label || config.defaultLabel}</span>
    </div>
  );
}

// Utility function to determine evolution type from data
export function getEvolutionType(
  deltaScore?: number,
  isLoop?: boolean,
  isBreakthrough?: boolean
): EvolutionType | null {
  if (isBreakthrough) return 'breakthrough';
  if (isLoop) return 'loop';
  if (deltaScore === undefined) return null;
  if (deltaScore > 0.2) return 'growth';
  if (deltaScore < -0.2) return 'regression';
  return null;
}

// Component to display multiple evolution signals
export function EvolutionSignals({
  signals,
  className = '',
}: {
  signals: EvolutionType[];
  className?: string;
}) {
  if (signals.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {signals.map((signal, index) => (
        <EvolutionBadge key={`${signal}-${index}`} type={signal} size="sm" />
      ))}
    </div>
  );
}
