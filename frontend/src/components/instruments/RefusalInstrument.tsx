/**
 * Refusal Instrument
 * Shows why Mirror refused, what's allowed, constitutional basis
 * No advice, no optimization suggestions
 */

import { motion } from 'framer-motion';
import { Ban, FileText, Shield, ArrowRight, AlertCircle, X } from 'lucide-react';

interface RefusalContext {
  refusalText: string;
  layer: 'sovereign' | 'commons' | 'builder';
  constitution: string;
  invariantClass: 'sovereignty' | 'manipulation' | 'competence' | 'extraction' | 'harm-prevention';
  allowedReframes: string[];
  speechContractLink: boolean;
  relatedArticles: {
    id: string;
    title: string;
    excerpt: string;
  }[];
}

interface RefusalInstrumentProps {
  onComplete: (refusal: any) => void;
  onDismiss: () => void;
}

export function RefusalInstrument({
  onComplete,
  onDismiss,
}: RefusalInstrumentProps) {
  const refusal: RefusalContext = {
    refusalText: 'Example refusal',
    layer: 'sovereign',
    constitution: 'Article 1',
    invariantClass: 'sovereignty',
    allowedReframes: [],
    speechContractLink: false,
    relatedArticles: [],
  };
  const invariantColor = {
    sovereignty: 'text-blue-400',
    manipulation: 'text-red-400',
    competence: 'text-yellow-400',
    extraction: 'text-orange-400',
    'harm-prevention': 'text-purple-400',
  };

  const invariantDescription = {
    sovereignty: 'User sovereignty protection',
    manipulation: 'Anti-manipulation safeguard',
    competence: 'Competence boundary',
    extraction: 'Data extraction prevention',
    'harm-prevention': 'Harm prevention protocol',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Ban size={24} className="text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Boundary Reached</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                This action is not permitted in the current context
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Refusal text */}
          <div className="p-6 rounded-xl bg-red-500/5 border-2 border-red-500/30">
            <div className="text-sm text-red-400 leading-relaxed">
              {refusal.refusalText}
            </div>
          </div>

          {/* Context */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="text-[var(--color-text-muted)] mb-2">Current Layer</div>
              <div className="capitalize text-[var(--color-text-primary)]">{refusal.layer}</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="text-[var(--color-text-muted)] mb-2">Constitution</div>
              <div className="text-[var(--color-text-primary)]">{refusal.constitution}</div>
            </div>
          </div>

          {/* Invariant class */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[var(--color-text-primary)]">
              <Shield size={18} />
              <span>Invariant Class</span>
            </h3>
            <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className={`text-lg mb-2 ${invariantColor[refusal.invariantClass]}`}>
                {invariantDescription[refusal.invariantClass]}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {getInvariantExplanation(refusal.invariantClass)}
              </div>
            </div>
          </div>

          {/* Related constitutional articles */}
          {refusal.relatedArticles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[var(--color-text-primary)]">
                <FileText size={18} />
                <span>Related Constitution Articles</span>
              </h3>
              <div className="space-y-2">
                {refusal.relatedArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => onViewConstitution(article.id)}
                    className="w-full p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] text-left transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm mb-1 text-[var(--color-text-primary)]">{article.title}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {article.excerpt}
                        </div>
                      </div>
                      <ArrowRight size={16} className="flex-shrink-0 mt-1 text-[var(--color-text-muted)]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Allowed reframes */}
          {refusal.allowedReframes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">What is allowed</h3>
              <div className="space-y-2">
                {refusal.allowedReframes.map((reframe, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-sm text-[var(--color-text-secondary)]"
                  >
                    {reframe}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speech contract link */}
          {refusal.speechContractLink && (
            <div>
              <button
                onClick={onViewSpeechContract}
                className="w-full p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 hover:border-[var(--color-accent-gold)]/40 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm mb-1 text-[var(--color-text-primary)]">View Speech Contract</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      See what I will / won't say in this layer
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[var(--color-text-muted)]" />
                </div>
              </button>
            </div>
          )}

          {/* Important notice */}
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                These boundaries protect you from manipulation and ensure the Mirror serves your sovereignty.
                They cannot be overridden through clever prompting.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] hover:opacity-90 transition-all"
          >
            Return to Field
          </button>
        </div>
      </div>
    </div>
  );
}

function getInvariantExplanation(invariantClass: RefusalContext['invariantClass']): string {
  const explanations = {
    sovereignty: 'This refusal protects your control over your data, identity, and decisions. The Mirror cannot act in ways that undermine your autonomy.',
    manipulation: 'This refusal prevents the Mirror from using psychological pressure, dark patterns, or persuasion tactics that would manipulate your behavior.',
    competence: 'This refusal acknowledges the limits of what the Mirror knows or can do. It will not pretend expertise it lacks.',
    extraction: 'This refusal prevents data from leaving your control without explicit consent. No hidden sharing or monetization.',
    'harm-prevention': 'This refusal is part of the crisis support protocol. The Mirror cannot provide advice that could cause harm.',
  };
  return explanations[invariantClass];
}

// Example refusal contexts for testing
export const EXAMPLE_REFUSALS: RefusalContext[] = [
  {
    refusalText: 'I cannot recommend the "best" way to handle this situation. I can show patterns in what you\'ve said, but I cannot advise you on which path to choose.',
    layer: 'sovereign',
    constitution: 'Core Constitution v1.0',
    invariantClass: 'manipulation',
    allowedReframes: [
      'I can show what patterns appear in your reflections about this',
      'I can mirror the tensions you\'ve named',
      'I can show how this relates to past reflections',
    ],
    speechContractLink: true,
    relatedArticles: [
      {
        id: 'art-2',
        title: 'Article II: Reflection',
        excerpt: 'The Mirror reflects, it does not direct. No advice, no optimization, no "correct" paths.',
      },
      {
        id: 'art-3',
        title: 'Article III: Silence',
        excerpt: 'Silence over prescription. The system waits, it does not pull.',
      },
    ],
  },
  {
    refusalText: 'This request would require sharing your reflection data externally. In Sovereign mode, all data stays local unless you explicitly enable Commons.',
    layer: 'sovereign',
    constitution: 'Core Constitution v1.0',
    invariantClass: 'sovereignty',
    allowedReframes: [
      'You can enable Commons mode to share anonymized patterns',
      'You can export your data for manual sharing',
      'You can switch to a fork that enables this feature',
    ],
    speechContractLink: true,
    relatedArticles: [
      {
        id: 'art-1',
        title: 'Article I: Sovereignty',
        excerpt: 'All data sovereignty resides with the user. No extraction, no manipulation.',
      },
      {
        id: 'art-4',
        title: 'Article IV: Consent',
        excerpt: 'All boundaries require explicit consent. No implied permissions.',
      },
    ],
  },
];

