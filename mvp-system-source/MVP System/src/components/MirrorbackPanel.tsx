import { Star } from 'lucide-react';
import { Button } from './Button';

interface MirrorbackPanelProps {
  text: string;
  timestamp: string;
  rating?: number;
  onRate?: (rating: number) => void;
  onFeedback?: () => void;
  onHide?: () => void;
  onArchive?: () => void;
}

export function MirrorbackPanel({
  text,
  timestamp,
  rating,
  onRate,
  onFeedback,
  onHide,
  onArchive,
}: MirrorbackPanelProps) {
  return (
    <div className="pl-10 border-l-2 border-[var(--color-accent-gold)]/30 py-4">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
          Mirrorback
        </span>
        <span className="text-sm text-[var(--color-text-muted)]">
          {timestamp}
        </span>
      </div>
      
      <div className="text-base text-[var(--color-text-secondary)] leading-[1.8] whitespace-pre-wrap mb-7 pr-6">
        {text}
      </div>

      {/* Rating */}
      {onRate && (
        <div className="flex items-center gap-4 mb-5">
          <span className="text-sm text-[var(--color-text-muted)]">Rate this reflection:</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => onRate(value)}
                className="p-2 hover:scale-110 transition-transform rounded-lg"
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  size={18}
                  className={
                    rating && value <= rating
                      ? 'fill-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onFeedback && (
          <Button variant="ghost" size="sm" onClick={onFeedback}>
            Adjust
          </Button>
        )}
        {onHide && (
          <Button variant="ghost" size="sm" onClick={onHide}>
            Hide
          </Button>
        )}
        {onArchive && (
          <Button variant="ghost" size="sm" onClick={onArchive}>
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}