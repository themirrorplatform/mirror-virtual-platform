/**
 * License Stack Instrument
 * Scroll-required acknowledgment. Delta disclosure. No coercion.
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, AlertCircle, Check } from 'lucide-react';

interface License {
  id: string;
  name: string;
  version: string;
  scope: 'core' | 'layer' | 'fork' | 'export' | 'tool' | 'worldview';
  fullText: string;
  implications: string[];
}

interface LicenseStackInstrumentProps {
  licenses: License[];
  onAcknowledge: (licenseIds: string[]) => void;
  onReturn: () => void;
}

export function LicenseStackInstrument({
  licenses,
  onAcknowledge,
  onReturn,
}: LicenseStackInstrumentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrolledLicenses, setScrolledLicenses] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentLicense = licenses[currentIndex];
  const isCurrentScrolled = scrolledLicenses.has(currentLicense.id);
  const allScrolled = licenses.every(l => scrolledLicenses.has(l.id));

  useEffect(() => {
    // Reset scroll position when license changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrolledToBottom = scrollHeight - scrollTop <= clientHeight + 10;
    
    if (scrolledToBottom && !scrolledLicenses.has(currentLicense.id)) {
      setScrolledLicenses(new Set([...scrolledLicenses, currentLicense.id]));
    }
  };

  const handleNext = () => {
    if (currentIndex < licenses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAcknowledgeAll = () => {
    onAcknowledge(licenses.map(l => l.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onReturn();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2>License Stack</h2>
            <div className="text-sm text-[var(--color-text-muted)]">
              {currentIndex + 1} of {licenses.length}
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            These licenses govern data routing and processing
          </p>
        </div>

        {/* Current license */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-gold)]/10 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-[var(--color-accent-gold)]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">{currentLicense.name}</h3>
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                  <span>Version {currentLicense.version}</span>
                  <span>•</span>
                  <span className="capitalize">{currentLicense.scope} scope</span>
                </div>
              </div>
              {isCurrentScrolled && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Check size={16} />
                  <span>Read</span>
                </div>
              )}
            </div>
          </div>

          {/* License text (scroll required) */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 text-sm text-[var(--color-text-secondary)] space-y-4"
          >
            {currentLicense.fullText.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            
            {/* Scroll indicator space */}
            <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">
              {!isCurrentScrolled && '↓ Scroll to continue'}
            </div>
          </div>

          {/* Delta disclosure */}
          {currentLicense.implications.length > 0 && (
            <div className="p-6 border-t border-[var(--color-border-subtle)] bg-[var(--color-accent-gold)]/5 flex-shrink-0">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
                <h4 className="text-sm">What changes</h4>
              </div>
              <ul className="space-y-2">
                {currentLicense.implications.map((implication, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--color-accent-gold)]">•</span>
                    <span>{implication}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onReturn}
              className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              Return
            </button>

            {currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
              >
                Previous
              </button>
            )}

            {currentIndex < licenses.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isCurrentScrolled}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next License
              </button>
            ) : (
              <button
                onClick={handleAcknowledgeAll}
                disabled={!allScrolled}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Acknowledge All
              </button>
            )}
          </div>

          {!isCurrentScrolled && (
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              Scroll to end of license to proceed
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Example license data structure
export const CORE_LICENSE: License = {
  id: 'core-v1',
  name: 'Mirror Core License',
  version: '1.0',
  scope: 'core',
  fullText: `This license governs all use of The Mirror system.

DATA SOVEREIGNTY
All processing occurs on your local device by default. Your reflections, identity data, and patterns remain under your exclusive control unless you explicitly enable sharing.

NO EXTRACTION
The Mirror does not collect, sell, or monetize your data. There is no tracking, no advertising, no third-party analytics.

LOCAL-FIRST PROCESSING
Reflection analysis, pattern recognition, and mirrorback generation happen on your device. No cloud dependencies for core functionality.

COMMONS PARTICIPATION (OPTIONAL)
If you enable Commons mode, you may contribute anonymized patterns to collective learning. This is entirely optional and revocable at any time.

FORK AUTONOMY
You may fork the system, modify constitutions, and create variants. Forks inherit base constitutional protections.

REVOCATION
You may revoke any consent, delete any data, and export everything at any time.

NO WARRANTY
The Mirror is provided as-is, without warranties of any kind. Use at your own discretion.

This license may be updated. You will be notified of changes and may choose to accept or reject them.`,
  implications: [
    'All reflection data stays on your device',
    'No external dependencies for core features',
    'You control all sharing and export decisions',
  ],
};

export const COMMONS_LICENSE: License = {
  id: 'commons-v1',
  name: 'Commons Participation License',
  version: '1.0',
  scope: 'layer',
  fullText: `This license governs participation in The Mirror Commons.

ANONYMIZED CONTRIBUTION
When you enable Commons mode, you may contribute anonymized reflection patterns to collective learning. All contributions are stripped of personally identifiable information.

PATTERN AGGREGATION
Your patterns may be aggregated with those of other users to improve reflection quality and discover emergent insights.

NO INDIVIDUAL TRACKING
The Commons does not track individual users. Contributions are anonymous and cannot be linked back to you.

EVOLUTION PROPOSALS
You may receive proposed improvements to reflection behavior based on collective learning. All proposals are optional and can be declined.

REVOCABLE CONSENT
You may disable Commons participation at any time. Past contributions cannot be retroactively removed from aggregates, but future contributions will cease.

GOVERNANCE PARTICIPATION
Commons participants may vote on governance proposals and constitutional amendments.

This license applies only when Commons mode is actively enabled.`,
  implications: [
    'Enables anonymized pattern contribution',
    'Allows receipt of collective evolution proposals',
    'Grants governance participation rights',
  ],
};

export const BUILDER_LICENSE: License = {
  id: 'builder-v1',
  name: 'Builder Tools License',
  version: '1.0',
  scope: 'tool',
  fullText: `This license governs access to Builder mode features.

EXPERIMENTAL FEATURES
Builder mode includes experimental, unstable, and potentially unsafe features. Use with caution and understanding.

FORK CREATION
You may create forks with modified constitutions, worldviews, and behaviors. Forks are isolated from your primary instance.

SYSTEM INTROSPECTION
Builder mode allows inspection of internal system state, learning patterns, and decision-making processes.

SANDBOX TESTING
You may test modifications in sandboxed environments before applying them.

RECOGNITION STATUS
Forks you create may not be recognized by the Commons or other users until they meet recognition criteria.

BUILDER RESPONSIBILITY
You are responsible for understanding the impact of changes you make in Builder mode.

NO SUPPORT GUARANTEES
Experimental features may break, lose data, or behave unexpectedly.`,
  implications: [
    'Enables fork creation and system modification',
    'Provides access to experimental features',
    'Allows constitutional editing and proposals',
  ],
};