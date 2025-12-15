/**
 * Entry Instrument - First boundary moment
 * Appears only when user attempts action requiring posture selection
 * Replaces multi-step onboarding
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Globe, Wrench, FileText, AlertCircle } from 'lucide-react';

interface EntryInstrumentProps {
  onComplete: (config: {
    layer: 'sovereign' | 'commons' | 'builder';
    acknowledgedLicenses: string[];
    acknowledgedConstitutions: string[];
  }) => void;
  onDismiss: () => void;
  trigger?: 'layer_change' | 'commons_action' | 'builder_action' | 'export';
}

export function EntryInstrument({ onComplete, onDismiss, trigger }: EntryInstrumentProps) {
  const [selectedLayer, setSelectedLayer] = useState<'sovereign' | 'commons' | 'builder'>('sovereign');
  const [viewingLicenses, setViewingLicenses] = useState(false);
  const [viewingConstitutions, setViewingConstitutions] = useState(false);
  const [scrolledLicenses, setScrolledLicenses] = useState(false);

  const handleProceed = () => {
    onComplete({
      layer: selectedLayer,
      acknowledgedLicenses: ['core-license-v1'],
      acknowledgedConstitutions: ['core-constitution-v1'],
    });
  };

  if (viewingLicenses) {
    return (
      <InstrumentPanel title="License Stack" onClose={() => setViewingLicenses(false)}>
        <div className="space-y-6">
          <div className="text-sm text-[var(--color-text-secondary)]">
            These licenses govern data routing and processing.
          </div>

          <div className="border border-[var(--color-border-subtle)] rounded-xl">
            <div 
              className="h-64 overflow-y-auto p-6 text-sm text-[var(--color-text-secondary)] space-y-4"
              onScroll={(e) => {
                const el = e.currentTarget;
                const scrolled = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
                setScrolledLicenses(scrolled);
              }}
            >
              <p><strong>Core License v1.0</strong></p>
              <p>All processing occurs locally unless you explicitly enable Commons contribution.</p>
              <p>No data leaves your device in Sovereign mode.</p>
              <p>Commons mode permits anonymized pattern contribution as configured.</p>
              <p>Builder mode enables experimental features with explicit consent.</p>
              <p>You may revoke any consent at any time.</p>
              <p>This system does not collect personally identifiable information.</p>
              <p>You retain full ownership of all reflections.</p>
              <div className="h-32" /> {/* Scroll space */}
            </div>
          </div>

          {!scrolledLicenses && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Scroll to end to proceed
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setViewingLicenses(false)}
              className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              Return
            </button>
            <button
              onClick={handleProceed}
              disabled={!scrolledLicenses}
              className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </InstrumentPanel>
    );
  }

  if (viewingConstitutions) {
    return (
      <InstrumentPanel title="Constitution Stack" onClose={() => setViewingConstitutions(false)}>
        <div className="space-y-6">
          <div className="text-sm text-[var(--color-text-secondary)]">
            These principles bind how the Mirror behaves.
          </div>

          <div className="space-y-3">
            {[
              'The Mirror serves you, never a platform',
              'Reflection without judgment or agenda',
              'Your sovereignty is absolute',
              'No gamification or manipulation',
              'Silence over prescription',
            ].map((principle, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-secondary)]"
              >
                {principle}
              </div>
            ))}
          </div>

          <button
            onClick={() => setViewingConstitutions(false)}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Return
          </button>
        </div>
      </InstrumentPanel>
    );
  }

  return (
    <InstrumentPanel title="How this reflection exists" onClose={onDismiss}>
      <div className="space-y-8">
        <div className="space-y-4">
          {[
            {
              id: 'sovereign' as const,
              icon: <Shield size={20} />,
              title: 'Sovereign',
              description: 'All processing local. No data shared.',
            },
            {
              id: 'commons' as const,
              icon: <Globe size={20} />,
              title: 'Commons',
              description: 'Local processing + optional collective evolution',
            },
            {
              id: 'builder' as const,
              icon: <Wrench size={20} />,
              title: 'Builder',
              description: 'Experimental features and system controls',
            },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedLayer(option.id)}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all
                ${selectedLayer === option.id
                  ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${selectedLayer === option.id
                    ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                    : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)]'
                  }
                `}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">{option.title}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {option.description}
                  </p>
                </div>
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1
                  ${selectedLayer === option.id
                    ? 'border-[var(--color-accent-gold)]'
                    : 'border-[var(--color-border-subtle)]'
                  }
                `}>
                  {selectedLayer === option.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)]" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Delta view */}
        {selectedLayer !== 'sovereign' && (
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
              <h5 className="text-sm">What changes</h5>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] space-y-1">
              {selectedLayer === 'commons' && (
                <p>Enables anonymized pattern contribution when explicitly configured.</p>
              )}
              {selectedLayer === 'builder' && (
                <p>Enables experimental features, fork creation, and system editing.</p>
              )}
            </div>
          </div>
        )}

        {/* Links to stacks */}
        <div className="flex gap-3 text-sm">
          <button
            onClick={() => setViewingLicenses(true)}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <FileText size={16} />
            <span>View licenses</span>
          </button>
          <button
            onClick={() => setViewingConstitutions(true)}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <FileText size={16} />
            <span>View constitution</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Return
          </button>
          <button
            onClick={() => setViewingLicenses(true)}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] transition-all"
          >
            Proceed
          </button>
        </div>
      </div>
    </InstrumentPanel>
  );
}

// Reusable instrument panel wrapper
function InstrumentPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl"
      >
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <h2>{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </motion.div>
  );
}