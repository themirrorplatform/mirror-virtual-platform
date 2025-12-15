/**
 * Emergency Shutdown - System halt interface
 * 
 * Features:
 * - Multi-step confirmation
 * - Reason requirement
 * - Guardian consensus check
 * - Data export before shutdown
 * - Countdown timer
 * - Cancellation option
 * - Permanent audit log
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Power,
  AlertTriangle,
  Shield,
  Download,
  Clock,
  X,
  Check,
  Info
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface EmergencyShutdownProps {
  onConfirm: (reason: string, exportData: boolean) => void;
  onCancel: () => void;
  requireGuardianConsensus?: boolean;
  guardianApprovals?: string[];
  totalGuardians?: number;
  isOpen: boolean;
}

type ShutdownStep = 'warning' | 'reason' | 'export' | 'consensus' | 'countdown' | 'final';

export function EmergencyShutdown({
  onConfirm,
  onCancel,
  requireGuardianConsensus = true,
  guardianApprovals = [],
  totalGuardians = 3,
  isOpen,
}: EmergencyShutdownProps) {
  const [step, setStep] = useState<ShutdownStep>('warning');
  const [reason, setReason] = useState('');
  const [exportData, setExportData] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [hasReadWarning, setHasReadWarning] = useState(false);

  const hasConsensus = guardianApprovals.length >= Math.ceil(totalGuardians * 0.66);
  const canProceed = {
    warning: hasReadWarning,
    reason: reason.length >= 100,
    export: true,
    consensus: !requireGuardianConsensus || hasConsensus,
    countdown: countdown === 0,
    final: true,
  };

  // Countdown timer
  useEffect(() => {
    if (step === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === 'countdown' && countdown === 0) {
      setStep('final');
    }
  }, [step, countdown]);

  const handleNext = () => {
    const steps: ShutdownStep[] = requireGuardianConsensus
      ? ['warning', 'reason', 'export', 'consensus', 'countdown', 'final']
      : ['warning', 'reason', 'export', 'countdown', 'final'];
    
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleConfirm = () => {
    onConfirm(reason, exportData);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-2 border-[var(--color-border-error)]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-border-error)]/10">
                <Power size={24} className="text-[var(--color-border-error)]" />
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-[var(--color-border-error)]">
                  Emergency Shutdown
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Step {['warning', 'reason', 'export', 'consensus', 'countdown', 'final'].indexOf(step) + 1} of{' '}
                  {requireGuardianConsensus ? 6 : 5}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={step === 'countdown'}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {step === 'warning' && (
                <WarningStep
                  hasRead={hasReadWarning}
                  onToggleRead={() => setHasReadWarning(!hasReadWarning)}
                />
              )}
              {step === 'reason' && (
                <ReasonStep reason={reason} setReason={setReason} />
              )}
              {step === 'export' && (
                <ExportStep exportData={exportData} setExportData={setExportData} />
              )}
              {step === 'consensus' && requireGuardianConsensus && (
                <ConsensusStep
                  approvals={guardianApprovals}
                  total={totalGuardians}
                  hasConsensus={hasConsensus}
                />
              )}
              {step === 'countdown' && (
                <CountdownStep countdown={countdown} onCancel={onCancel} />
              )}
              {step === 'final' && (
                <FinalStep reason={reason} exportData={exportData} />
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={step === 'countdown' || step === 'final'}
              >
                Cancel
              </Button>

              {step !== 'final' ? (
                <Button
                  variant="ghost"
                  onClick={handleNext}
                  disabled={!canProceed[step]}
                  className="text-[var(--color-border-error)]"
                >
                  {step === 'countdown' ? 'Shutting down...' : 'Continue'}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleConfirm}
                  className="text-[var(--color-border-error)]"
                >
                  Confirm Shutdown
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Step Components

function WarningStep({ hasRead, onToggleRead }: { hasRead: boolean; onToggleRead: () => void }) {
  return (
    <motion.div
      key="warning"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Card className="border-2 border-[var(--color-border-error)]">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-[var(--color-border-error)] mt-0.5" />
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
            <p className="font-medium text-[var(--color-border-error)]">
              This will immediately halt all Mirror operations.
            </p>
            <p>Emergency shutdown should only be used when:</p>
            <ul className="space-y-1 ml-4">
              <li>• A severe constitutional violation is occurring</li>
              <li>• A critical security breach has been detected</li>
              <li>• User data sovereignty is at immediate risk</li>
              <li>• The system is behaving in ways that violate core invariants</li>
            </ul>
            <p className="text-[var(--color-text-muted)]">
              All active sessions will be terminated. Users will lose unsaved work. 
              This action is logged permanently and publicly.
            </p>
          </div>
        </div>
      </Card>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasRead}
          onChange={onToggleRead}
          className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
        />
        <span className="text-sm text-[var(--color-text-secondary)]">
          I understand the consequences and have verified that emergency shutdown is necessary
        </span>
      </label>
    </motion.div>
  );
}

function ReasonStep({ reason, setReason }: { reason: string; setReason: (r: string) => void }) {
  return (
    <motion.div
      key="reason"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h4 className="text-sm font-medium mb-2">Justification (Required)</h4>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a detailed explanation for why emergency shutdown is necessary. This will be permanently logged and publicly visible."
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none"
          rows={8}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {reason.length}/100 characters minimum
        </p>
      </div>

      <Card variant="emphasis">
        <div className="flex items-start gap-3">
          <Info size={14} className="text-[var(--color-accent-blue)] mt-0.5" />
          <p className="text-xs text-[var(--color-text-secondary)]">
            Your justification will be reviewed by the community. Frivolous or unjustified 
            shutdowns may result in removal of guardian privileges.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

function ExportStep({ exportData, setExportData }: { exportData: boolean; setExportData: (e: boolean) => void }) {
  return (
    <motion.div
      key="export"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-[var(--color-accent-blue)]" />
            <h4 className="text-sm font-medium">Data Export</h4>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Before shutdown, we can export all user data to allow recovery.
          </p>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-[var(--color-surface-hover)]">
            <input
              type="checkbox"
              checked={exportData}
              onChange={(e) => setExportData(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
            />
            <div>
              <span className="text-sm font-medium block mb-1">
                Export all user data before shutdown
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                Recommended: This allows users to recover their reflections, threads, and 
                identity data when the system restarts.
              </span>
            </div>
          </label>
        </div>
      </Card>
    </motion.div>
  );
}

function ConsensusStep({ approvals, total, hasConsensus }: { approvals: string[]; total: number; hasConsensus: boolean }) {
  const required = Math.ceil(total * 0.66);

  return (
    <motion.div
      key="consensus"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Card className={`border-2 ${hasConsensus ? 'border-[var(--color-accent-green)]' : 'border-[var(--color-border-warning)]'}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield size={20} className={hasConsensus ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-border-warning)]'} />
            <div>
              <h4 className="text-sm font-medium">Guardian Consensus</h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                {approvals.length} of {total} guardians • {required} required (66%)
              </p>
            </div>
          </div>

          <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(approvals.length / total) * 100}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${hasConsensus ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-border-warning)]'}`}
            />
          </div>

          {approvals.length > 0 && (
            <div className="space-y-1">
              {approvals.map((guardian) => (
                <div key={guardian} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-[var(--color-accent-green)]" />
                  <span className="text-[var(--color-text-secondary)]">{guardian}</span>
                </div>
              ))}
            </div>
          )}

          {!hasConsensus && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Waiting for {required - approvals.length} more guardian{required - approvals.length !== 1 ? 's' : ''}...
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function CountdownStep({ countdown, onCancel }: { countdown: number; onCancel: () => void }) {
  return (
    <motion.div
      key="countdown"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Card className="border-2 border-[var(--color-border-error)]">
        <div className="text-center space-y-4">
          <Clock size={48} className="mx-auto text-[var(--color-border-error)]" />
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Shutting down in
            </p>
            <motion.div
              key={countdown}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-[var(--color-border-error)]"
            >
              {countdown}
            </motion.div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Last chance to cancel. All operations will halt when countdown reaches zero.
          </p>
        </div>
      </Card>

      {countdown > 5 && (
        <Button
          variant="primary"
          onClick={onCancel}
          className="w-full"
        >
          Cancel Shutdown
        </Button>
      )}
    </motion.div>
  );
}

function FinalStep({ reason, exportData }: { reason: string; exportData: boolean }) {
  return (
    <motion.div
      key="final"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Card className="border-2 border-[var(--color-border-error)]">
        <div className="space-y-4">
          <h4 className="font-medium text-[var(--color-border-error)]">
            Final Confirmation
          </h4>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-[var(--color-text-muted)]">Reason:</span>
              <p className="text-[var(--color-text-secondary)] mt-1 p-2 rounded bg-[var(--color-surface-hover)]">
                {reason}
              </p>
            </div>

            <div>
              <span className="text-[var(--color-text-muted)]">Data Export:</span>
              <p className="text-[var(--color-text-secondary)] mt-1">
                {exportData ? 'Enabled - User data will be exported' : 'Disabled - No export'}
              </p>
            </div>
          </div>

          <Card variant="emphasis">
            <p className="text-xs text-[var(--color-text-secondary)]">
              This action is irreversible and will be permanently logged. Click "Confirm Shutdown" 
              to proceed.
            </p>
          </Card>
        </div>
      </Card>
    </motion.div>
  );
}

export type { ShutdownStep };
