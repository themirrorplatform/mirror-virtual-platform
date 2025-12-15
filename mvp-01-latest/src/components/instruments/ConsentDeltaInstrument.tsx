import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle, Info, ChevronRight, ChevronDown, ExternalLink, Clock } from 'lucide-react';
import { useState } from 'react';
import { Layer } from './LayerHUD';

type ImpactLevel = 'low' | 'medium' | 'high';

interface CategoryChange {
  category: string;
  before: string;
  after: string;
  impactLevel: ImpactLevel;
  description: string;
  estimatedEffect?: string;
}

interface ConsentDeltaInstrumentProps {
  triggerAction: string;
  fromLayer?: Layer;
  toLayer?: Layer;
  changes: CategoryChange[];
  constitutionChanges: string[];
  effectiveWhen: string;
  onProceed: () => void;
  onCancel: () => void;
  onViewConstitution?: (article: string) => void;
}

const impactConfig = {
  low: {
    color: 'var(--color-success)',
    label: 'Low Impact',
    icon: Info
  },
  medium: {
    color: 'var(--color-warning)',
    label: 'Medium Impact',
    icon: AlertTriangle
  },
  high: {
    color: 'var(--color-error)',
    label: 'High Impact',
    icon: Shield
  }
};

export function ConsentDeltaInstrument({
  triggerAction,
  fromLayer,
  toLayer,
  changes,
  constitutionChanges,
  effectiveWhen,
  onProceed,
  onCancel,
  onViewConstitution
}: ConsentDeltaInstrumentProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllChanges, setShowAllChanges] = useState(false);
  const [understoodRisks, setUnderstoodRisks] = useState(false);

  const highImpactCount = changes.filter(c => c.impactLevel === 'high').length;
  const mediumImpactCount = changes.filter(c => c.impactLevel === 'medium').length;
  const lowImpactCount = changes.filter(c => c.impactLevel === 'low').length;

  const hasHighImpact = highImpactCount > 0;
  const requiresAcknowledgment = hasHighImpact;

  const displayedChanges = showAllChanges ? changes : changes.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/70 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl flex flex-col overflow-hidden shadow-ambient-xl"
        role="dialog"
        aria-label="Review changes before proceeding"
      >
        {/* Header */}
        <div className="p-8 border-b border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-emphasis)]/20 to-transparent">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-4 rounded-2xl shadow-ambient-sm ${
              hasHighImpact 
                ? 'bg-[var(--color-error)]/10' 
                : 'bg-[var(--color-surface-emphasis)]'
            }`}>
              <Shield size={24} className={
                hasHighImpact 
                  ? 'text-[var(--color-error)]' 
                  : 'text-[var(--color-accent-gold)]'
              } />
            </div>
            <div className="flex-1">
              <h2 className="text-[var(--color-text-primary)] mb-2 text-xl font-semibold tracking-tight">Review Changes</h2>
              <p className="text-base text-[var(--color-text-secondary)] leading-[1.6]">
                {triggerAction}
              </p>
            </div>
          </div>

          {/* Layer transition visualization */}
          {fromLayer && toLayer && (
            <div className="mb-6 p-5 rounded-2xl bg-[var(--color-surface-emphasis)] shadow-ambient-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-text-muted)] mb-1.5">From</div>
                  <div className="text-base text-[var(--color-text-primary)] capitalize font-medium">
                    {fromLayer} Layer
                  </div>
                </div>
                <ChevronRight size={24} className="text-[var(--color-text-muted)]" />
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-text-muted)] mb-1.5">To</div>
                  <div className="text-base text-[var(--color-text-primary)] capitalize font-medium">
                    {toLayer} Layer
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Impact Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl shadow-ambient-sm ${
              highImpactCount > 0 
                ? 'bg-[var(--color-error)]/10 border border-[var(--color-error)]/30' 
                : 'bg-[var(--color-surface-emphasis)]'
            }`}>
              <div className={`text-3xl font-bold mb-2 ${
                highImpactCount > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'
              }`}>
                {highImpactCount}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">High Impact</div>
            </div>
            <div className={`p-5 rounded-2xl shadow-ambient-sm ${
              mediumImpactCount > 0 
                ? 'bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30' 
                : 'bg-[var(--color-surface-emphasis)]'
            }`}>
              <div className={`text-3xl font-bold mb-2 ${
                mediumImpactCount > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]'
              }`}>
                {mediumImpactCount}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">Medium Impact</div>
            </div>
            <div className="p-5 rounded-2xl bg-[var(--color-surface-emphasis)] shadow-ambient-sm">
              <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                {lowImpactCount}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">Low Impact</div>
            </div>
          </div>
        </div>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-4">
            {displayedChanges.map((change, index) => {
              const isExpanded = expandedCategory === change.category;
              const config = impactConfig[change.impactLevel];
              const Icon = config.icon;

              return (
                <motion.div
                  key={change.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl border transition-all shadow-ambient-sm ${
                    isExpanded 
                      ? 'border-[var(--color-accent-gold)]' 
                      : change.impactLevel === 'high'
                      ? 'border-[var(--color-error)]/30'
                      : change.impactLevel === 'medium'
                      ? 'border-[var(--color-warning)]/30'
                      : 'border-[var(--color-border-subtle)]'
                  }`}
                >
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : change.category)}
                    className="w-full p-5 text-left flex items-start gap-4"
                  >
                    {/* Impact indicator */}
                    <div className={`p-2.5 rounded-xl ${
                      change.impactLevel === 'high' 
                        ? 'bg-[var(--color-error)]/20'
                        : change.impactLevel === 'medium'
                        ? 'bg-[var(--color-warning)]/20'
                        : 'bg-[var(--color-success)]/20'
                    }`}>
                      <Icon size={18} style={{ color: config.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-2">
                            {change.category}
                          </h3>
                          <span className="text-sm px-3 py-1 rounded-lg" style={{
                            backgroundColor: `${config.color}20`,
                            color: config.color
                          }}>
                            {config.label}
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={18} className="text-[var(--color-text-muted)]" />
                        </motion.div>
                      </div>

                      {/* Before/After comparison */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-4 rounded-xl bg-[var(--color-surface-emphasis)]">
                          <div className="text-sm text-[var(--color-text-muted)] mb-2">Before</div>
                          <div className="text-base text-[var(--color-text-secondary)] leading-[1.6]">
                            {change.before}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--color-surface-emphasis)]">
                          <div className="text-sm text-[var(--color-text-muted)] mb-2">After</div>
                          <div className="text-base text-[var(--color-text-primary)] font-medium leading-[1.6]">
                            {change.after}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4">
                          <div className="p-4 rounded-xl bg-[var(--color-surface-emphasis)]">
                            <div className="text-sm text-[var(--color-text-muted)] mb-2">
                              What this means
                            </div>
                            <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
                              {change.description}
                            </p>
                          </div>

                          {change.estimatedEffect && (
                            <div className={`p-4 rounded-xl border ${
                              change.impactLevel === 'high'
                                ? 'bg-[var(--color-error)]/5 border-[var(--color-error)]/20'
                                : change.impactLevel === 'medium'
                                ? 'bg-[var(--color-warning)]/5 border-[var(--color-warning)]/20'
                                : 'bg-[var(--color-success)]/5 border-[var(--color-success)]/20'
                            }`}>
                              <div className="text-sm text-[var(--color-text-muted)] mb-2">
                                Estimated effect
                              </div>
                              <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
                                {change.estimatedEffect}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Show more button */}
            {changes.length > 5 && !showAllChanges && (
              <button
                onClick={() => setShowAllChanges(true)}
                className="w-full p-5 rounded-2xl border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-base text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)]"
              >
                Show {changes.length - 5} more changes
              </button>
            )}
          </div>

          {/* Constitution Changes */}
          {constitutionChanges.length > 0 && (
            <div className="mt-8 p-6 rounded-2xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 shadow-ambient-sm">
              <div className="flex items-start gap-3 mb-4">
                <Info size={18} className="text-[var(--color-accent-gold)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-base text-[var(--color-text-primary)] mb-2">
                    Constitutional Changes ({constitutionChanges.length})
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-[1.6]">
                    The following constitutional articles govern this change
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {constitutionChanges.map((article, i) => (
                  <button
                    key={i}
                    onClick={() => onViewConstitution?.(article)}
                    className="px-4 py-2 rounded-xl bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-emphasis)] text-sm text-[var(--color-accent-gold)] transition-colors flex items-center gap-2"
                  >
                    <span>{article}</span>
                    {onViewConstitution && <ExternalLink size={12} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Effective When */}
          <div className="mt-8 p-5 rounded-2xl bg-[var(--color-surface-emphasis)] shadow-ambient-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <Clock size={16} className="text-[var(--color-text-muted)]" />
              <span className="text-sm text-[var(--color-text-muted)]">Takes effect</span>
            </div>
            <p className="text-base text-[var(--color-text-secondary)] leading-[1.6]">
              {effectiveWhen}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-emphasis)]/30">
          {/* High impact acknowledgment */}
          {requiresAcknowledgment && (
            <label className="flex items-start gap-4 p-6 mb-6 rounded-2xl bg-[var(--color-error)]/5 border border-[var(--color-error)]/20 cursor-pointer shadow-ambient-sm">
              <input
                type="checkbox"
                checked={understoodRisks}
                onChange={(e) => setUnderstoodRisks(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-base text-[var(--color-text-primary)] mb-2">
                  I understand these changes
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-[1.6]">
                  {highImpactCount} high-impact {highImpactCount === 1 ? 'change' : 'changes'} will take effect. You can reverse this action later.
                </p>
              </div>
            </label>
          )}

          {/* Equal-weight action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onCancel}
              className="px-6 py-4 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-base font-medium transition-colors shadow-ambient-sm"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              disabled={requiresAcknowledgment && !understoodRisks}
              className="px-6 py-4 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-ambient-sm"
            >
              Proceed
            </button>
          </div>

          <p className="text-sm text-center text-[var(--color-text-muted)] mt-5 leading-[1.6]">
            Both choices have equal weight. Choose what serves your reflection.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}