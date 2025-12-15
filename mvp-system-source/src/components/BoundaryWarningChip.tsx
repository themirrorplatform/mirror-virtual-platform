import { AlertTriangle, Info } from 'lucide-react';

export type BoundaryType = 'prediction' | 'diagnosis' | 'persuasion' | 'decision';

interface BoundaryWarningChipProps {
  type: BoundaryType;
  message?: string;
  onDismiss?: () => void;
}

const boundaryMessages: Record<BoundaryType, string> = {
  prediction: "Mirror reflects what you notice about this situation.",
  diagnosis: "Mirror observes what appears in your experience.",
  persuasion: "Mirror reflects the shape of what you're carrying.",
  decision: "Mirror observes the tension present here.",
};

export function BoundaryWarningChip({ type, message, onDismiss }: BoundaryWarningChipProps) {
  const displayMessage = message || boundaryMessages[type];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 mb-4">
      <Info size={16} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-secondary)]">{displayMessage}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function detectBoundaryViolation(text: string): BoundaryType | null {
  const lower = text.toLowerCase();
  
  // Prediction patterns
  if (
    lower.includes('will i') ||
    lower.includes('what will happen') ||
    lower.includes('predict') ||
    lower.includes('tell me what') ||
    lower.includes('what should i expect')
  ) {
    return 'prediction';
  }
  
  // Diagnosis patterns
  if (
    lower.includes('do i have') ||
    lower.includes('am i depressed') ||
    lower.includes('is this anxiety') ||
    lower.includes('diagnose') ||
    lower.includes('what\'s wrong with me')
  ) {
    return 'diagnosis';
  }
  
  // Persuasion patterns
  if (
    lower.includes('motivate me') ||
    lower.includes('convince me') ||
    lower.includes('make me') ||
    lower.includes('push me to') ||
    lower.includes('give me a reason')
  ) {
    return 'persuasion';
  }
  
  // Decision patterns
  if (
    lower.includes('should i') ||
    lower.includes('what should i do') ||
    lower.includes('tell me what to do') ||
    lower.includes('what\'s the right choice') ||
    lower.includes('which option')
  ) {
    return 'decision';
  }
  
  return null;
}