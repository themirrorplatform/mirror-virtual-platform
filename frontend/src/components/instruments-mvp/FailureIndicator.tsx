import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, Clock, FileText, ShieldOff, Ban, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';

export type FailureLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type FailureManifestation = 'latency' | 'shortened' | 'withheld' | 'downgrade' | 'refusal';

export interface FailureState {
  level: FailureLevel;
  manifestation: FailureManifestation;
  reason: string;
  constitutionalArticle?: string;
  recoveryEstimate?: string;
  canRetry: boolean;
  alternativeActions?: string[];
}

interface FailureIndicatorProps {
  failure: FailureState;
  onExplain?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  persistent?: boolean;
}

const levelConfig = {
  L1: {
    color: 'var(--color-text-muted)',
    label: 'Subtle',
    intensity: 0.3,
    description: 'Minor processing delay'
  },
  L2: {
    color: 'var(--color-accent-blue)',
    label: 'Noticeable',
    intensity: 0.5,
    description: 'Response affected'
  },
  L3: {
    color: 'var(--color-warning)',
    label: 'Significant',
    intensity: 0.7,
    description: 'Partial capability loss'
  },
  L4: {
    color: 'var(--color-error)',
    label: 'Severe',
    intensity: 0.9,
    description: 'Major capability limitation'
  },
  L5: {
    color: 'var(--color-error)',
    label: 'Complete',
    intensity: 1,
    description: 'Full refusal or failure'
  }
};

const manifestationConfig = {
  latency: {
    icon: Clock,
    label: 'Response Delayed',
    behavior: 'Processing slower than normal'
  },
  shortened: {
    icon: FileText,
    label: 'Response Shortened',
    behavior: 'Less detail provided'
  },
  withheld: {
    icon: ShieldOff,
    label: 'Content Withheld',
    behavior: 'Some content omitted'
  },
  downgrade: {
    icon: AlertCircle,
    label: 'Capability Downgraded',
    behavior: 'Operating at reduced capacity'
  },
  refusal: {
    icon: Ban,
    label: 'Action Refused',
    behavior: 'Cannot proceed with request'
  }
};

export function FailureIndicator({
  failure,
  onExplain,
  onRetry,
  onDismiss,
  persistent = false
}: FailureIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const config = levelConfig[failure.level];
  const manifestation = manifestationConfig[failure.manifestation];
  const Icon = manifestation.icon;

  // Auto-dismiss non-persistent failures after delay based on level
  useEffect(() => {
    if (!persistent && failure.level !== 'L5' && !showDetails) {
      const dismissDelay = failure.level === 'L1' ? 3000 : failure.level === 'L2' ? 5000 : 8000;
      const timer = setTimeout(() => {
        setDismissed(true);
        onDismiss?.();
      }, dismissDelay);
      return () => clearTimeout(timer);
    }
  }, [persistent, failure.level, showDetails, onDismiss]);

  // Track time elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  const position = failure.level === 'L1' || failure.level === 'L2' 
    ? 'bottom-6 right-6' 
    : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

  const size = failure.level === 'L1' 
    ? 'max-w-sm' 
    : failure.level === 'L2'
    ? 'max-w-md'
    : failure.level === 'L3'
    ? 'max-w-lg'
    : 'max-w-xl';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: failure.level === 'L1' ? 0.9 : 0.95,
          y: failure.level === 'L1' || failure.level === 'L2' ? 20 : 0
        }}
        animate={{ 
          opacity: config.intensity, 
          scale: 1,
          y: 0
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.9,
          y: failure.level === 'L1' || failure.level === 'L2' ? 20 : 0
        }}
        className={`fixed ${position} ${size} z-50`}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div 
          className="bg-[var(--color-surface-card)] border rounded-2xl overflow-hidden shadow-ambient-xl"
          style={{ 
            borderColor: config.color,
            borderWidth: failure.level === 'L1' ? '1px' : '2px'
          }}
        >
          {/* Subtle pulse animation for higher levels */}
          {(failure.level === 'L4' || failure.level === 'L5') && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ backgroundColor: config.color }}
              animate={{ 
                opacity: [0.05, 0.15, 0.05]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              {/* Icon with loading state for latency */}
              <div className="relative">
                {failure.manifestation === 'latency' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader size={24} style={{ color: config.color }} />
                  </motion.div>
                ) : (
                  <Icon size={24} style={{ color: config.color }} />
                )}
                
                {/* Level indicator */}
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-[var(--color-surface-card)] flex items-center justify-center text-[10px] font-bold"
                  style={{ 
                    backgroundColor: config.color,
                    color: 'black'
                  }}
                >
                  {failure.level.replace('L', '')}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 
                    className="text-base font-medium"
                    style={{ color: config.color }}
                  >
                    {manifestation.label}
                  </h3>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-[1.6]">
                  {manifestation.behavior}
                </p>
              </div>

              {/* Time elapsed for persistent failures */}
              {(persistent || failure.level === 'L5') && timeElapsed > 0 && (
                <div className="text-sm text-[var(--color-text-muted)]">
                  {timeElapsed}s
                </div>
              )}
            </div>

            {/* Reason - shown for L3+ or when details expanded */}
            <AnimatePresence>
              {(failure.level !== 'L1' && failure.level !== 'L2') || showDetails ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-5"
                >
                  <div className="p-5 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
                    <div className="text-sm text-[var(--color-text-muted)] mb-2">What happened</div>
                    <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
                      {failure.reason}
                    </p>

                    {/* Constitutional article reference */}
                    {failure.constitutionalArticle && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                        <div className="text-sm text-[var(--color-text-muted)] mb-2">
                          Constitutional boundary
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] leading-[1.6]">
                          {failure.constitutionalArticle}
                        </div>
                      </div>
                    )}

                    {/* Recovery estimate */}
                    {failure.recoveryEstimate && failure.manifestation === 'latency' && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                        <div className="text-sm text-[var(--color-text-muted)] mb-2">
                          Estimated recovery
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] leading-[1.6]">
                          {failure.recoveryEstimate}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Alternative actions - for L4 and L5 */}
            <AnimatePresence>
              {showDetails && failure.alternativeActions && failure.alternativeActions.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-5"
                >
                  <div className="p-5 rounded-2xl bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 shadow-ambient-sm">
                    <div className="text-sm text-[var(--color-text-muted)] mb-3">
                      What you can do instead
                    </div>
                    <div className="space-y-2.5">
                      {failure.alternativeActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                          <span className="text-[var(--color-success)] mt-0.5">•</span>
                          <span className="leading-[1.7]">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Why button - always available */}
              {onExplain && (
                <button
                  onClick={() => {
                    setShowDetails(!showDetails);
                    if (!showDetails) {
                      onExplain();
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors flex items-center justify-center gap-2 shadow-ambient-sm"
                  aria-expanded={showDetails}
                  aria-label={showDetails ? 'Hide details' : 'Show why this happened'}
                >
                  <HelpCircle size={16} />
                  <span>{showDetails ? 'Hide' : 'Why?'}</span>
                </button>
              )}

              {/* Retry - if available */}
              {failure.canRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-ambient-sm"
                  style={{
                    backgroundColor: `${config.color}20`,
                    color: config.color
                  }}
                  aria-label="Retry action"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.5 }}
                  >
                    ↻
                  </motion.div>
                  <span>Retry</span>
                </button>
              )}

              {/* Dismiss - for non-critical failures */}
              {failure.level !== 'L5' && onDismiss && (
                <button
                  onClick={() => {
                    setDismissed(true);
                    onDismiss();
                  }}
                  className="px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] text-sm transition-colors shadow-ambient-sm"
                  aria-label="Dismiss notification"
                >
                  Dismiss
                </button>
              )}
            </div>

            {/* Progress bar for auto-dismiss */}
            {!persistent && failure.level !== 'L5' && !showDetails && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 rounded-full"
                style={{ backgroundColor: config.color }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ 
                  duration: failure.level === 'L1' ? 3 : failure.level === 'L2' ? 5 : 8,
                  ease: 'linear'
                }}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing failure states
export function useFailurePhenomenology() {
  const [failures, setFailures] = useState<(FailureState & { id: string })[]>([]);

  const addFailure = (failure: FailureState) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFailures(prev => [...prev, { ...failure, id }]);
    return id;
  };

  const removeFailure = (id: string) => {
    setFailures(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFailures = () => {
    setFailures([]);
  };

  return {
    failures,
    addFailure,
    removeFailure,
    clearAllFailures
  };
}