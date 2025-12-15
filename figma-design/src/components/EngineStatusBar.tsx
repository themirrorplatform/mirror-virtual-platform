import { Shield, AlertTriangle, CheckCircle2, Cpu, Cloud, HardDrive, Pause } from 'lucide-react';

export type EngineMode = 'local-only' | 'local-cloud' | 'offline';
export type LearningState = 'active' | 'paused' | 'local-only';
export type TrustLevel = 'verified' | 'warning' | 'critical';

interface EngineStatusBarProps {
  engineName?: string;
  engineVersion?: string;
  mode?: EngineMode;
  learningState?: LearningState;
  trustLevel?: TrustLevel;
  modelVerified?: boolean;
  guardrailsActive?: boolean;
  onStatusClick?: () => void;
}

export function EngineStatusBar({
  engineName = 'MirrorCore',
  engineVersion = '1.0.3',
  mode = 'local-only',
  learningState = 'active',
  trustLevel = 'verified',
  modelVerified = true,
  guardrailsActive = true,
  onStatusClick,
}: EngineStatusBarProps) {
  const bgColor = 
    trustLevel === 'critical' ? 'bg-[var(--color-accent-red)]/10 border-[var(--color-accent-red)]/30' :
    trustLevel === 'warning' ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)]/30' :
    'bg-[var(--color-base-raised)] border-[var(--color-border-subtle)]';

  return (
    <button
      onClick={onStatusClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 border ${bgColor} transition-colors hover:border-[var(--color-accent-gold)] cursor-pointer`}
    >
      <div className="flex items-center gap-6">
        {/* Engine Info */}
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-primary)]">
            {engineName} <span className="text-[var(--color-text-muted)]">v{engineVersion}</span>
          </span>
        </div>

        {/* Mode */}
        <div className="flex items-center gap-2">
          {mode === 'local-only' ? (
            <HardDrive size={14} className="text-[var(--color-accent-green)]" />
          ) : mode === 'local-cloud' ? (
            <Cloud size={14} className="text-[var(--color-accent-blue)]" />
          ) : (
            <HardDrive size={14} className="text-[var(--color-text-muted)]" />
          )}
          <span className="text-xs text-[var(--color-text-secondary)]">
            {mode === 'local-only' && 'Local-only'}
            {mode === 'local-cloud' && 'Local + Cloud'}
            {mode === 'offline' && 'Offline'}
          </span>
        </div>

        {/* Learning State */}
        <div className="flex items-center gap-2">
          {learningState === 'paused' && <Pause size={14} className="text-[var(--color-accent-gold)]" />}
          <span className="text-xs text-[var(--color-text-secondary)]">
            Learning: {learningState === 'active' ? 'On' : learningState === 'paused' ? 'Paused' : 'Local-only'}
          </span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center gap-3">
        {modelVerified ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-accent-green)]/20">
            <CheckCircle2 size={12} className="text-[var(--color-accent-green)]" />
            <span className="text-xs text-[var(--color-accent-green)]">Model Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-accent-red)]/20">
            <AlertTriangle size={12} className="text-[var(--color-accent-red)]" />
            <span className="text-xs text-[var(--color-accent-red)]">Unverified Model</span>
          </div>
        )}

        {guardrailsActive && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-accent-gold)]/20">
            <Shield size={12} className="text-[var(--color-accent-gold)]" />
            <span className="text-xs text-[var(--color-accent-gold)]">Guardrails Active</span>
          </div>
        )}

        {trustLevel === 'warning' && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-[var(--color-accent-gold)]" />
            <span className="text-xs text-[var(--color-accent-gold)]">Cloud models unavailable</span>
          </div>
        )}

        {trustLevel === 'critical' && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-[var(--color-accent-red)]" />
            <span className="text-xs text-[var(--color-accent-red)]">Integrity check failed</span>
          </div>
        )}
      </div>
    </button>
  );
}

export function EngineStatusBarCompact({
  mode = 'local-only',
  trustLevel = 'verified',
  onStatusClick,
}: Pick<EngineStatusBarProps, 'mode' | 'trustLevel' | 'onStatusClick'>) {
  return (
    <button
      onClick={onStatusClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-xs"
    >
      {mode === 'local-only' ? (
        <HardDrive size={12} className="text-[var(--color-accent-green)]" />
      ) : (
        <Cloud size={12} className="text-[var(--color-accent-blue)]" />
      )}
      <span className="text-[var(--color-text-secondary)]">
        {mode === 'local-only' ? 'Local-only' : mode === 'local-cloud' ? 'Local+Cloud' : 'Offline'}
      </span>
      {trustLevel === 'verified' ? (
        <CheckCircle2 size={12} className="text-[var(--color-accent-green)]" />
      ) : (
        <AlertTriangle size={12} className="text-[var(--color-accent-gold)]" />
      )}
    </button>
  );
}
