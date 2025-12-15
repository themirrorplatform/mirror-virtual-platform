import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'emphasis' | 'subtle';
  className?: string;
}

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  const variantStyles = {
    default: 'bg-[var(--color-surface-card)]',
    emphasis: 'bg-[var(--color-surface-emphasis)]',
    subtle: 'bg-[var(--color-base-raised)]',
  };

  return (
    <div className={`rounded-2xl border border-[var(--color-border-subtle)] p-8 shadow-ambient-sm ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface ReflectionCardProps {
  text: string;
  timestamp: string;
  isUser?: boolean;
  className?: string;
}

export function ReflectionCard({ text, timestamp, isUser = true, className = '' }: ReflectionCardProps) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-base text-[var(--color-text-muted)]">
            {isUser ? 'You reflected' : 'The Mirror'}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">{timestamp}</span>
        </div>
        <p className="text-base text-[var(--color-text-primary)] leading-[1.8] whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </Card>
  );
}

interface MirrorbackCardProps {
  text: string;
  timestamp: string;
  onRate?: (rating: number) => void;
  onFeedback?: () => void;
  rating?: number;
  className?: string;
}

export function MirrorbackCard({ 
  text, 
  timestamp, 
  onRate, 
  onFeedback,
  rating,
  className = '' 
}: MirrorbackCardProps) {
  return (
    <Card variant="emphasis" className={className}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
              <span className="text-xs text-[var(--color-text-inverse)]">M</span>
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">Mirrorback</span>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">{timestamp}</span>
        </div>
        
        <p className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
          {text}
        </p>

        {onRate && (
          <div className="flex flex-col gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRate(star)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {rating && rating >= star ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              {onFeedback && (
                <button
                  onClick={onFeedback}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  This didn{"'"}t feel right
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

interface ProposalCardProps {
  title: string;
  domain: string;
  integrity: {
    uniqueMirrors: number;
    trustLevel: 'high' | 'medium' | 'low';
  };
  constitutionalScore: number;
  onAdopt?: () => void;
  onReview?: () => void;
  className?: string;
}

export function ProposalCard({
  title,
  domain,
  integrity,
  constitutionalScore,
  onAdopt,
  onReview,
  className = '',
}: ProposalCardProps) {
  const trustColors = {
    high: 'text-[var(--color-accent-green)]',
    medium: 'text-[var(--color-accent-blue)]',
    low: 'text-[var(--color-accent-red)]',
  };

  return (
    <Card className={className}>
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="mb-2">{title}</h4>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)]">
              {domain}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Constitutional Score</span>
            <span className="text-[var(--color-text-primary)]">{constitutionalScore}%</span>
          </div>
          <div className="h-2 bg-[var(--color-base-raised)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--color-accent-gold)]"
              style={{ width: `${constitutionalScore}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">
            Trust: <span className={trustColors[integrity.trustLevel]}>{integrity.trustLevel}</span>
          </span>
          <span className="text-[var(--color-text-muted)]">
            {integrity.uniqueMirrors} mirrors
          </span>
        </div>

        {(onAdopt || onReview) && (
          <div className="flex gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
            {onReview && (
              <button
                onClick={onReview}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-surface-emphasis)] text-[var(--color-text-primary)] hover:bg-[var(--color-base-raised)] transition-colors"
              >
                Review
              </button>
            )}
            {onAdopt && (
              <button
                onClick={onAdopt}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-gold-deep)] transition-colors"
              >
                Adopt
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}