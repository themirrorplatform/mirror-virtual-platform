/**
 * Onboarding Flow - Constitutional introduction
 * 
 * Features:
 * - Non-prescriptive introduction
 * - Skip-friendly
 * - No forced tutorials
 * - Constitutional language
 * - Optional exploration
 * - User sovereignty from the start
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight,
  Check,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  optional?: boolean;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingFlow({ steps, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, step.id]));
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-surface-base)]/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="relative">
          {/* Skip Button */}
          {onSkip && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              title="Skip"
            >
              <X size={20} />
            </button>
          )}

          {/* Progress */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              {steps.map((s, index) => (
                <div
                  key={s.id}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    index <= currentStep
                      ? 'bg-[var(--color-accent-blue)]'
                      : 'bg-[var(--color-surface-hover)]'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 min-h-[300px]"
            >
              <div>
                <h2 className="text-2xl font-medium mb-2">{step.title}</h2>
                <p className="text-[var(--color-text-secondary)]">{step.description}</p>
              </div>

              <div>{step.content}</div>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  <Check size={16} />
                  Begin
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Welcome Step - First introduction
 */
export function WelcomeStep() {
  return (
    <div className="space-y-4">
      <div className="p-6 rounded-lg bg-[var(--color-accent-blue)]/10 border-l-4 border-[var(--color-accent-blue)]">
        <p className="text-lg leading-relaxed">
          The Mirror is a space for reflection. Not productivity. Not optimization. 
          Not self-improvement in the conventional sense.
        </p>
      </div>

      <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
        <p>Here's what this is:</p>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <Check size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
            <span>A place where thoughts can exist without pressure</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
            <span>A system that waits, never pushes</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
            <span>Your data, under your complete control</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Realms Step - Introduce navigation
 */
export function RealmsStep() {
  const realms = [
    { name: 'Mirror', description: 'Private reflection space' },
    { name: 'Threads', description: 'Evolution over time' },
    { name: 'World', description: 'Witnessing others' },
    { name: 'Archive', description: 'Memory without shame' },
    { name: 'Self', description: 'Identity & sovereignty' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        The Mirror is organized into five realms. Each serves a different mode of reflection.
      </p>

      <div className="space-y-2">
        {realms.map(realm => (
          <div
            key={realm.name}
            className="p-3 rounded-lg bg-[var(--color-surface-hover)] flex items-center gap-3"
          >
            <ChevronRight size={16} className="text-[var(--color-accent-blue)]" />
            <div className="flex-1">
              <p className="font-medium text-sm">{realm.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{realm.description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--color-text-muted)] italic">
        You can explore these in any order. There is no correct path.
      </p>
    </div>
  );
}

/**
 * Constitution Step - Explain the principles
 */
export function ConstitutionStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        This platform is governed by a constitution that protects your sovereignty:
      </p>

      <div className="space-y-3">
        <ConstitutionalPrinciple
          title="No prescribed paths"
          description="The system never tells you what to do next"
        />
        <ConstitutionalPrinciple
          title="No metrics of worth"
          description="No streaks, no completion bars, no gamification"
        />
        <ConstitutionalPrinciple
          title="Your data, your control"
          description="Export everything. Delete anything. No lock-in."
        />
        <ConstitutionalPrinciple
          title="Silence as default"
          description="The UI waits. It doesn't demand attention."
        />
      </div>
    </div>
  );
}

function ConstitutionalPrinciple({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <Sparkles size={16} className="text-[var(--color-accent-blue)] mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-sm mb-1">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

/**
 * Identity Axes Step - Introduce axes
 */
export function IdentityAxesStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Identity Axes let you reflect from different aspects of yourself:
      </p>

      <div className="p-4 rounded-lg bg-[var(--color-surface-hover)]">
        <p className="text-sm mb-3">Examples (you define your own):</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent-blue)]" />
            <span>Parent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]" />
            <span>Professional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent-purple)]" />
            <span>Creative</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] italic">
        These are not roles. They are lenses through which you can view your reflections.
      </p>
    </div>
  );
}

/**
 * Default Onboarding Steps
 */
export const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'What this space is',
    content: <WelcomeStep />,
  },
  {
    id: 'realms',
    title: 'Five Realms',
    description: 'Modes of reflection',
    content: <RealmsStep />,
  },
  {
    id: 'constitution',
    title: 'Constitutional Principles',
    description: 'How this platform operates',
    content: <ConstitutionStep />,
  },
  {
    id: 'axes',
    title: 'Identity Axes',
    description: 'Reflecting from different perspectives',
    content: <IdentityAxesStep />,
    optional: true,
  },
];

/**
 * Onboarding Checklist - Alternative non-linear approach
 */
interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  onItemComplete: (itemId: string) => void;
  onDismiss: () => void;
}

export function OnboardingChecklist({ items, onItemComplete, onDismiss }: OnboardingChecklistProps) {
  const completedCount = items.filter(item => item.completed).length;
  const allCompleted = completedCount === items.length;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium mb-1">Getting Started</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {completedCount} of {items.length} explored
            </p>
          </div>
          {allCompleted && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X size={16} />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => {
                item.action?.();
                onItemComplete(item.id);
              }}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                item.completed
                  ? 'bg-[var(--color-accent-green)]/10'
                  : 'bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-blue)]/10'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.completed
                  ? 'bg-[var(--color-accent-green)] text-white'
                  : 'border-2 border-[var(--color-border-subtle)]'
              }`}>
                {item.completed && <Check size={14} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">{item.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {allCompleted && (
          <div className="pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-accent-green)]">
              <Check size={16} />
              <span>You've explored the basics. The rest is yours to discover.</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * useOnboarding Hook
 */
export function useOnboarding(key: string = 'onboarding-complete') {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem(key);
  });

  const completeOnboarding = () => {
    localStorage.setItem(key, 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(key);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}

export type { OnboardingStep, OnboardingFlowProps, ChecklistItem };
