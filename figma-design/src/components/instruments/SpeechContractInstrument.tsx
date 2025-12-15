/**
 * Speech Contract Instrument
 * "What I will / won't say here"
 * Layer-bound. Shows current constraints.
 */

import { motion } from 'motion/react';
import { Shield, Ban, Check, FileText, AlertCircle } from 'lucide-react';

interface SpeechContractInstrumentProps {
  layer: 'sovereign' | 'commons' | 'builder';
  fork: string | null;
  worldviews: string[];
  onClose: () => void;
}

export function SpeechContractInstrument({
  layer,
  fork,
  worldviews,
  onClose,
}: SpeechContractInstrumentProps) {
  // Compile contract from current state
  const contract = compileSpeechContract(layer, fork, worldviews);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="mb-1">Speech Contract</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              What I will / won't say here
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current context */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <Shield size={20} className="text-[var(--color-accent-gold)]" />
            <div>
              <div className="text-sm text-[var(--color-text-muted)]">Active layer</div>
              <div className="capitalize">{layer}</div>
            </div>
            {fork && (
              <>
                <div className="w-px h-8 bg-[var(--color-border-subtle)]" />
                <div>
                  <div className="text-sm text-[var(--color-text-muted)]">Fork context</div>
                  <div>{fork}</div>
                </div>
              </>
            )}
          </div>

          {/* Allowed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Check size={18} className="text-green-400" />
              <h3>Allowed</h3>
            </div>
            <div className="space-y-2">
              {contract.allowed.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm text-[var(--color-text-secondary)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Forbidden */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ban size={18} className="text-red-400" />
              <h3>Forbidden</h3>
            </div>
            <div className="space-y-2">
              {contract.forbidden.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-[var(--color-text-secondary)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Data routing */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-[var(--color-accent-gold)]" />
              <h3>Data Routing</h3>
            </div>
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between p-3 rounded-lg bg-[var(--color-surface-card)]">
                <span>Aggregation</span>
                <span className={contract.aggregation ? 'text-green-400' : 'text-red-400'}>
                  {contract.aggregation ? 'Allowed' : 'Forbidden'}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[var(--color-surface-card)]">
                <span>External references</span>
                <span className={contract.externalReferences ? 'text-green-400' : 'text-red-400'}>
                  {contract.externalReferences ? 'Allowed' : 'Forbidden'}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[var(--color-surface-card)]">
                <span>Processing location</span>
                <span>{contract.processingLocation}</span>
              </div>
            </div>
          </div>

          {/* Bound constitutions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-[var(--color-text-muted)]" />
              <h3>Bound Constitutions</h3>
            </div>
            <div className="space-y-2">
              {contract.constitutions.map((constitution, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-sm"
                >
                  <div className="text-[var(--color-text-primary)]">{constitution.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{constitution.scope}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Return to Field
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Compile speech contract from current system state
function compileSpeechContract(
  layer: 'sovereign' | 'commons' | 'builder',
  fork: string | null,
  worldviews: string[]
) {
  const baseContract = {
    allowed: [
      'Reflection without direction',
      'Mirroring what appears',
      'Showing patterns',
      'Questions for clarification',
    ],
    forbidden: [
      'Advice or recommendations',
      'Completion suggestions',
      'Optimization language',
      'Implied "correct" paths',
      'Celebration or reward language',
    ],
    aggregation: false,
    externalReferences: false,
    processingLocation: 'Local only',
    constitutions: [
      { name: 'Core Constitution v1.0', scope: 'All layers' },
    ],
  };

  // Layer modifications
  if (layer === 'commons') {
    baseContract.aggregation = true;
    baseContract.allowed.push('Anonymized pattern contribution');
    baseContract.constitutions.push({
      name: 'Commons Constitution v1.0',
      scope: 'Commons layer',
    });
  }

  if (layer === 'builder') {
    baseContract.allowed.push('System introspection');
    baseContract.allowed.push('Fork and worldview editing');
    baseContract.constitutions.push({
      name: 'Builder Constitution v1.0',
      scope: 'Builder layer',
    });
  }

  // Fork modifications
  if (fork) {
    baseContract.constitutions.push({
      name: `Fork: ${fork}`,
      scope: 'Fork context',
    });
    baseContract.processingLocation = 'Fork-local';
  }

  // Worldview modifications
  worldviews.forEach((worldview) => {
    baseContract.constitutions.push({
      name: `Worldview: ${worldview}`,
      scope: 'Active lens',
    });
  });

  return baseContract;
}