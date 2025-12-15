/**
 * Proposal Composer - Create new governance proposals
 * 
 * Features:
 * - Multi-step form (title, description, full text, rationale)
 * - Markdown editor for full text
 * - Preview mode
 * - Guardian review notification
 * - Submit for voting
 * - Draft save
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Eye,
  Send,
  Save,
  X,
  Info,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProposalDraft {
  title: string;
  description: string;
  fullText: string;
  rationale: string;
  requiresSuperMajority: boolean;
}

interface ProposalComposerProps {
  onSubmit: (proposal: ProposalDraft) => void;
  onSaveDraft?: (proposal: ProposalDraft) => void;
  onClose: () => void;
  initialDraft?: Partial<ProposalDraft>;
}

type Step = 'basics' | 'full_text' | 'rationale' | 'preview';

const STEPS: { id: Step; label: string; description: string }[] = [
  { 
    id: 'basics', 
    label: 'Basics', 
    description: 'Title and short description' 
  },
  { 
    id: 'full_text', 
    label: 'Full Text', 
    description: 'Complete proposal text' 
  },
  { 
    id: 'rationale', 
    label: 'Rationale', 
    description: 'Why this change matters' 
  },
  { 
    id: 'preview', 
    label: 'Preview', 
    description: 'Review before submitting' 
  },
];

export function ProposalComposer({
  onSubmit,
  onSaveDraft,
  onClose,
  initialDraft,
}: ProposalComposerProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [draft, setDraft] = useState<ProposalDraft>({
    title: initialDraft?.title || '',
    description: initialDraft?.description || '',
    fullText: initialDraft?.fullText || '',
    rationale: initialDraft?.rationale || '',
    requiresSuperMajority: initialDraft?.requiresSuperMajority ?? true,
  });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return draft.title.length >= 10 && draft.description.length >= 20;
      case 'full_text':
        return draft.fullText.length >= 100;
      case 'rationale':
        return draft.rationale.length >= 50;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onSubmit(draft);
    } else {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(draft);
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
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileText size={24} className="text-[var(--color-accent-blue)] mt-1" />
                <div>
                  <h2 className="mb-1">Create Proposal</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Propose a constitutional amendment
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    disabled={index > currentStepIndex}
                    className="flex items-center gap-2 flex-1"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        step.id === currentStep
                          ? 'bg-[var(--color-accent-blue)] text-white'
                          : index < currentStepIndex
                          ? 'bg-[var(--color-accent-green)] text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-medium">{step.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {step.description}
                      </p>
                    </div>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        index < currentStepIndex
                          ? 'bg-[var(--color-accent-green)]'
                          : 'bg-[var(--color-border-subtle)]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {currentStep === 'basics' && (
                <BasicsStep draft={draft} setDraft={setDraft} />
              )}
              {currentStep === 'full_text' && (
                <FullTextStep draft={draft} setDraft={setDraft} />
              )}
              {currentStep === 'rationale' && (
                <RationaleStep draft={draft} setDraft={setDraft} />
              )}
              {currentStep === 'preview' && (
                <PreviewStep draft={draft} />
              )}
            </AnimatePresence>

            {/* Guardian Review Notice */}
            {currentStep === 'preview' && (
              <Card className="border-2 border-[var(--color-accent-blue)]">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    <p className="mb-2">
                      <strong>Proposals are reviewed by Guardians</strong> before entering the voting period.
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      Guardians can veto proposals that violate core constitutional invariants. 
                      If approved, voting will open for 14 days.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </Button>
                )}
                {onSaveDraft && (
                  <Button
                    variant="ghost"
                    onClick={handleSaveDraft}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    Save Draft
                  </Button>
                )}
              </div>

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {isLastStep ? (
                  <>
                    <Send size={16} />
                    Submit for Review
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Step Components

interface StepProps {
  draft: ProposalDraft;
  setDraft: (draft: ProposalDraft) => void;
}

function BasicsStep({ draft, setDraft }: StepProps) {
  return (
    <motion.div
      key="basics"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-2">
          Proposal Title
        </label>
        <input
          type="text"
          value={draft.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, title: e.target.value })}
          placeholder="A clear, concise title for your proposal"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
          maxLength={100}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {draft.title.length}/100 • Minimum 10 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Short Description
        </label>
        <textarea
          value={draft.description}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, description: e.target.value })}
          placeholder="A brief summary of what this proposal changes"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none"
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {draft.description.length}/300 • Minimum 20 characters
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.requiresSuperMajority}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, requiresSuperMajority: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--color-border-subtle)]"
          />
          <span className="text-sm">Requires supermajority (66%+)</span>
        </label>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 ml-6">
          Recommended for constitutional changes
        </p>
      </div>
    </motion.div>
  );
}

function FullTextStep({ draft, setDraft }: StepProps) {
  return (
    <motion.div
      key="full_text"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-2">
          Full Proposal Text
        </label>
        <textarea
          value={draft.fullText}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, fullText: e.target.value })}
          placeholder="The complete text of your proposal. Be specific about what changes and how."
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none font-mono text-sm"
          rows={15}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {draft.fullText.length} characters • Minimum 100 characters
        </p>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-[var(--color-border-warning)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-1">
              <strong>Be precise.</strong> This text becomes part of the constitutional record.
            </p>
            <p className="text-[var(--color-text-muted)]">
              Specify exactly what changes, what stays the same, and any edge cases.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function RationaleStep({ draft, setDraft }: StepProps) {
  return (
    <motion.div
      key="rationale"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-2">
          Rationale
        </label>
        <textarea
          value={draft.rationale}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, rationale: e.target.value })}
          placeholder="Why is this change necessary? What problem does it solve? What are the tradeoffs?"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none"
          rows={10}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {draft.rationale.length} characters • Minimum 50 characters
        </p>
      </div>

      <Card>
        <div className="text-xs text-[var(--color-text-secondary)]">
          <p className="mb-2 font-medium">Good rationales include:</p>
          <ul className="space-y-1 ml-4">
            <li>• The problem this solves</li>
            <li>• Why existing approaches don't work</li>
            <li>• What happens if we don't change</li>
            <li>• Potential downsides and how they're mitigated</li>
          </ul>
        </div>
      </Card>
    </motion.div>
  );
}

function PreviewStep({ draft }: { draft: ProposalDraft }) {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Card>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3>{draft.title}</h3>
              {draft.requiresSuperMajority && (
                <Badge variant="warning" size="sm">
                  Supermajority
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {draft.description}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Full Text</h4>
            <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
              <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)] font-mono">
                {draft.fullText}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Rationale</h4>
            <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {draft.rationale}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export type { ProposalDraft };




