import { motion } from 'framer-motion';
import { Wrench, CheckCircle, XCircle, AlertTriangle, GitBranch } from 'lucide-react';
import { useState } from 'react';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

interface BuilderCompilerInstrumentProps {
  activeFork?: string;
  activeConstitution: string;
  mode: 'edit' | 'test' | 'publish';
  testResults?: TestResult[];
  blastRadius: 'sovereign-only' | 'fork-local' | 'commons' | 'public';
  onRunTests: () => void;
  onSaveDraft: () => void;
  onPublishProposal: () => void;
  onCreateFork: () => void;
  onClose: () => void;
}

const blastRadiusConfig = {
  'sovereign-only': { color: 'var(--color-success)', label: 'Sovereign Only', impact: 'Only affects your local instance' },
  'fork-local': { color: 'var(--color-accent-blue)', label: 'Fork Local', impact: 'Affects only this fork' },
  'commons': { color: 'var(--color-warning)', label: 'Commons', impact: 'May affect Commons participants' },
  'public': { color: 'var(--color-error)', label: 'Public', impact: 'Affects all users of this Mirror' }
};

export function BuilderCompilerInstrument({
  activeFork,
  activeConstitution,
  mode,
  testResults,
  blastRadius,
  onRunTests,
  onSaveDraft,
  onPublishProposal,
  onCreateFork,
  onClose
}: BuilderCompilerInstrumentProps) {
  const [publishing, setPublishing] = useState(false);
  const radiusConfig = blastRadiusConfig[blastRadius];

  const handlePublish = async () => {
    setPublishing(true);
    await onPublishProposal();
    setPublishing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-[var(--color-surface-emphasis)]">
            <Wrench size={20} className="text-[var(--color-accent-red)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[var(--color-text-primary)] mb-1">Builder Compiler</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Constitutional editing and testing toolchain
            </p>
          </div>
        </div>

        {/* Context */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {activeFork && (
            <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Active Fork</div>
              <div className="text-sm text-[var(--color-accent-gold)]">{activeFork}</div>
            </div>
          )}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
            <div className="text-xs text-[var(--color-text-muted)] mb-1">Constitution</div>
            <div className="text-sm text-[var(--color-text-primary)]">{activeConstitution}</div>
          </div>
        </div>

        {/* Blast Radius Warning */}
        <div
          className="mb-6 p-4 rounded-2xl border"
          style={{
            backgroundColor: `${radiusConfig.color}10`,
            borderColor: `${radiusConfig.color}30`
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} style={{ color: radiusConfig.color }} className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm mb-1" style={{ color: radiusConfig.color }}>
                Impact Scope: {radiusConfig.label}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">{radiusConfig.impact}</p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {mode === 'test' && testResults && (
          <div className="mb-6">
            <div className="text-sm text-[var(--color-text-primary)] mb-3">Test Results</div>
            <div className="space-y-2">
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border ${
                    result.passed
                      ? 'bg-[var(--color-success)]/5 border-[var(--color-success)]/20'
                      : 'bg-[var(--color-error)]/5 border-[var(--color-error)]/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.passed ? (
                      <CheckCircle size={16} className="text-[var(--color-success)] mt-0.5" />
                    ) : (
                      <XCircle size={16} className="text-[var(--color-error)] mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className={`text-sm mb-1 ${result.passed ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                        {result.test}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">{result.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publishing Flow */}
        {mode === 'publish' && (
          <div className="mb-6 p-4 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)]">
            <div className="text-sm text-[var(--color-text-primary)] mb-3">Publishing Options</div>
            <div className="space-y-2">
              <button
                onClick={onSaveDraft}
                className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] text-left transition-colors"
              >
                <div className="text-sm text-[var(--color-text-primary)] mb-1">Save as Local Override</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Changes apply only to your instance
                </div>
              </button>

              <button
                onClick={onCreateFork}
                className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] text-left transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch size={14} className="text-[var(--color-accent-gold)]" />
                  <span className="text-sm text-[var(--color-text-primary)]">Publish as Fork</span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Create a new constitutional variant
                </div>
              </button>

              {blastRadius === 'commons' || blastRadius === 'public' ? (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full p-3 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 hover:bg-[var(--color-warning)]/20 text-left transition-colors disabled:opacity-50"
                >
                  <div className="text-sm text-[var(--color-warning)] mb-1">
                    {publishing ? 'Publishing...' : 'Submit Commons Proposal'}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    Requires community governance approval
                  </div>
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Consequence Warning (Builder feels heavier) */}
        <div className="mb-6 p-4 rounded-2xl bg-[var(--color-error)]/5 border border-[var(--color-error)]/20">
          <div className="text-sm text-[var(--color-text-primary)] mb-2">Constitutional Changes Have Consequences</div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Builder mode gives you power to modify core rules. Test thoroughly and understand the impact scope before publishing.
            Constitutional changes cannot be easily undone once accepted by governance.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {mode === 'edit' && (
            <button
              onClick={onRunTests}
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-sm font-medium transition-colors"
            >
              Run Constitutional Tests
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
