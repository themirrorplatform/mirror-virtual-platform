/**
 * Mistake Reporter - Quick feedback collection
 * 
 * Features:
 * - Report mistakes in door recommendations
 * - 5 mistake types
 * - Context text area
 * - Submit with confirmation
 * - "Thank you for teaching us" feedback
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  X,
  Send,
  Check,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type MistakeType = 
  | 'wrong_posture'
  | 'lens_mismatch'
  | 'asymmetry_incorrect'
  | 'reflective_condition_off'
  | 'other';

interface MistakeReport {
  doorId: string;
  doorTitle: string;
  mistakeType: MistakeType;
  context: string;
  currentPosture?: string;
  activeLenses?: string[];
}

interface MistakeReporterProps {
  doorId: string;
  doorTitle: string;
  currentPosture?: string;
  activeLenses?: string[];
  onSubmit: (report: MistakeReport) => void;
  onClose: () => void;
}

const MISTAKE_TYPES = [
  {
    id: 'wrong_posture' as MistakeType,
    label: 'Wrong Posture Match',
    description: 'This door doesn't match my declared posture',
    icon: '🎯',
  },
  {
    id: 'lens_mismatch' as MistakeType,
    label: 'Lens Mismatch',
    description: 'Lens tags don't align with my active lenses',
    icon: '👓',
  },
  {
    id: 'asymmetry_incorrect' as MistakeType,
    label: 'Asymmetry Data Wrong',
    description: 'The asymmetry report seems inaccurate',
    icon: '⚖️',
  },
  {
    id: 'reflective_condition_off' as MistakeType,
    label: 'Reflective Condition Mismatch',
    description: 'Doesn't match what I'm reflecting on',
    icon: '💭',
  },
  {
    id: 'other' as MistakeType,
    label: 'Other Issue',
    description: 'Something else is wrong',
    icon: '❓',
  },
];

export function MistakeReporter({
  doorId,
  doorTitle,
  currentPosture,
  activeLenses,
  onSubmit,
  onClose,
}: MistakeReporterProps) {
  const [selectedType, setSelectedType] = useState<MistakeType | null>(null);
  const [context, setContext] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedType) return;

    onSubmit({
      doorId,
      doorTitle,
      mistakeType: selectedType,
      context,
      currentPosture,
      activeLenses,
    });

    setSubmitted(true);

    // Auto-close after showing thanks
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <Card>
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={24} className="text-[var(--color-accent-blue)] mt-1" />
                    <div>
                      <h3 className="mb-1">Report Mistake</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Help us improve the Finder by reporting routing mistakes
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X size={20} />
                  </Button>
                </div>

                {/* Door Info */}
                <Card>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Door</p>
                      <p className="text-sm font-medium">{doorTitle}</p>
                    </div>
                    {currentPosture && (
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Your Posture</p>
                        <Badge variant="secondary" size="sm">{currentPosture}</Badge>
                      </div>
                    )}
                    {activeLenses && activeLenses.length > 0 && (
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Active Lenses</p>
                        <div className="flex flex-wrap gap-1">
                          {activeLenses.map((lens) => (
                            <Badge key={lens} variant="secondary" size="sm">{lens}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Mistake Type */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">What went wrong?</h4>
                  <div className="space-y-2">
                    {MISTAKE_TYPES.map((type) => (
                      <MistakeTypeButton
                        key={type.id}
                        type={type}
                        selected={selectedType === type.id}
                        onSelect={() => setSelectedType(type.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Context */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional Context <span className="text-[var(--color-text-muted)]">(optional)</span>
                  </label>
                  <textarea
                    value={context}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContext(e.target.value)}
                    placeholder="Help us understand what went wrong..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-sm resize-none"
                    rows={4}
                  />
                </div>

                {/* Info */}
                <Card className="border-2 border-[var(--color-accent-blue)]">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      <p className="mb-2">
                        <strong>Mistake reports help the Finder learn.</strong> Your feedback 
                        improves routing for everyone.
                      </p>
                      <p className="text-[var(--color-text-muted)]">
                        Reports are anonymous by default. Your posture and active lenses are 
                        included to help diagnose the issue.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!selectedType}
                    className="flex items-center gap-2"
                  >
                    <Send size={16} />
                    Submit Report
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-accent-green)]/20 mb-4"
                >
                  <Check size={32} className="text-[var(--color-accent-green)]" />
                </motion.div>
                <h3 className="mb-2">Thank you for teaching us</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Your feedback helps the Finder improve
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  );
}

interface MistakeTypeButtonProps {
  type: {
    id: MistakeType;
    label: string;
    description: string;
    icon: string;
  };
  selected: boolean;
  onSelect: () => void;
}

function MistakeTypeButton({ type, selected, onSelect }: MistakeTypeButtonProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full p-3 rounded-lg border-2 transition-all text-left"
      style={{
        borderColor: selected ? 'var(--color-accent-blue)' : 'var(--color-border-subtle)',
        backgroundColor: selected ? 'var(--color-accent-blue)/10' : 'var(--color-surface-card)',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label={type.label}>
          {type.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{type.label}</span>
            {selected && (
              <Check size={14} className="text-[var(--color-accent-blue)]" />
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {type.description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export type { MistakeReport };



