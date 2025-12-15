import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, Clock, TrendingUp } from 'lucide-react';

// Progress and feedback components
// Constitutional: Only for technical processes, never for human completion

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'purple' | 'blue' | 'neutral';
  showPercentage?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  label,
  sublabel,
  size = 'md',
  color = 'gold',
  showPercentage = false,
  indeterminate = false,
  className = '',
}: ProgressBarProps) {
  const colors = {
    gold: 'bg-[var(--color-accent-gold)]',
    purple: 'bg-[var(--color-accent-purple)]',
    blue: 'bg-[var(--color-accent-blue)]',
    neutral: 'bg-[var(--color-text-secondary)]',
  };

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {/* Labels */}
      {(label || sublabel || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          <div>
            {label && (
              <div className="text-sm text-[var(--color-text-primary)] font-medium">
                {label}
              </div>
            )}
            {sublabel && (
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {sublabel}
              </div>
            )}
          </div>
          {showPercentage && !indeterminate && (
            <div className="text-sm text-[var(--color-text-secondary)] font-mono">
              {Math.round(clampedProgress)}%
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className={`relative w-full ${heights[size]} rounded-full bg-[var(--color-surface-emphasis)] overflow-hidden`}>
        {indeterminate ? (
          <motion.div
            className={`absolute inset-y-0 w-1/3 ${colors[color]} rounded-full`}
            animate={{
              x: ['-100%', '400%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ) : (
          <motion.div
            className={`h-full ${colors[color]} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1],
            }}
          />
        )}
      </div>
    </div>
  );
}

// Circular progress (for focused tasks)
export function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 4,
  color = 'gold',
  label,
  showPercentage = true,
  indeterminate = false,
  className = '',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: 'gold' | 'purple' | 'blue' | 'neutral';
  label?: string;
  showPercentage?: boolean;
  indeterminate?: boolean;
  className?: string;
}) {
  const colors = {
    gold: '#CBA35D',
    purple: '#8B7BAF',
    blue: '#5A8BFF',
    neutral: '#9ca3af',
  };

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-surface-emphasis)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {indeterminate ? (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors[color]}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{
                strokeDashoffset: [0, circumference],
                rotate: [0, 360],
              }}
              transition={{
                strokeDashoffset: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                },
                rotate: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            />
          ) : (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors[color]}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1],
              }}
            />
          )}
        </svg>

        {/* Center content */}
        {showPercentage && !indeterminate && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-mono text-[var(--color-text-primary)]">
              {Math.round(clampedProgress)}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="text-xs text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
    </div>
  );
}

// Step progress (multi-stage processes)
export function StepProgress({
  steps,
  currentStep,
  className = '',
}: {
  steps: Array<{ label: string; description?: string }>;
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isComplete
                    ? 'bg-[var(--color-accent-gold)] border-[var(--color-accent-gold)]'
                    : isCurrent
                    ? 'bg-transparent border-[var(--color-accent-gold)]'
                    : 'bg-transparent border-[var(--color-border-subtle)]'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 size={20} className="text-black" />
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-[var(--color-accent-gold)]'
                        : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {index + 1}
                  </span>
                )}

                {/* Pulse for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[var(--color-accent-gold)]"
                    animate={{
                      scale: [1, 1.3],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isComplete || isCurrent
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 ${
                  isComplete
                    ? 'bg-[var(--color-accent-gold)]'
                    : 'bg-[var(--color-border-subtle)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Processing stages (for complex operations)
export function ProcessingStages({
  stages,
  currentStage,
  className = '',
}: {
  stages: Array<{ label: string; status: 'pending' | 'processing' | 'complete' | 'error' }>;
  currentStage: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {stages.map((stage, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Status indicator */}
          {stage.status === 'complete' ? (
            <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
          ) : stage.status === 'processing' ? (
            <Loader2 size={20} className="text-[var(--color-accent-gold)] animate-spin flex-shrink-0" />
          ) : stage.status === 'error' ? (
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          ) : (
            <Clock size={20} className="text-[var(--color-text-muted)] flex-shrink-0" />
          )}

          {/* Label */}
          <span
            className={`text-sm ${
              stage.status === 'complete'
                ? 'text-[var(--color-text-secondary)]'
                : stage.status === 'processing'
                ? 'text-[var(--color-text-primary)] font-medium'
                : stage.status === 'error'
                ? 'text-red-400'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            {stage.label}
          </span>

          {/* Progress bar for current processing stage */}
          {stage.status === 'processing' && (
            <div className="flex-1 h-1 rounded-full bg-[var(--color-surface-emphasis)] overflow-hidden">
              <motion.div
                className="h-full bg-[var(--color-accent-gold)] rounded-full"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ width: '50%' }}
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Time estimate (for patient waiting)
export function TimeEstimate({
  seconds,
  label = 'Estimated time',
  className = '',
}: {
  seconds: number;
  label?: string;
  className?: string;
}) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const timeString =
    minutes > 0
      ? `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`
      : `${remainingSeconds}s`;

  return (
    <div className={`flex items-center gap-2 text-xs text-[var(--color-text-muted)] ${className}`}>
      <Clock size={14} />
      <span>
        {label}: {timeString}
      </span>
    </div>
  );
}

import { AlertCircle } from 'lucide-react';

// Export all
export { CircularProgress, StepProgress, ProcessingStages, TimeEstimate };
