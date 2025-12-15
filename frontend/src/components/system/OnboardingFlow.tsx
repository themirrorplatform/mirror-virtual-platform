/**
 * Onboarding Flow - Constitutional first-time experience
 * 
 * Features:
 * - Non-coercive introduction
 * - Skip at any time
 * - Constitutional principles explanation
 * - No forced tutorial
 * - "You can start anytime" framing
 * - Optional setup steps
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  Eye,
  TrendingUp,
  Archive,
  User,
  ChevronRight,
  X,
  Check,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

type OnboardingStep = 'welcome' | 'mirror' | 'threads' | 'world' | 'principles' | 'ready';

const STEPS: OnboardingStep[] = ['welcome', 'mirror', 'threads', 'world', 'principles', 'ready'];

export function OnboardingFlow({ onComplete, onSkip, isOpen }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [hasSeenPrinciples, setHasSeenPrinciples] = useState(false);

  const currentIndex = STEPS.indexOf(currentStep);

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
      if (STEPS[nextIndex] === 'principles') {
        setHasSeenPrinciples(true);
      }
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep === 'welcome' || hasSeenPrinciples) {
      onSkip();
    } else {
      // Jump to principles if not seen yet
      setCurrentStep('principles');
      setHasSeenPrinciples(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {STEPS.map((step, index) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full transition-all ${
                      index <= currentIndex
                        ? 'bg-[var(--color-accent-blue)] w-8'
                        : 'bg-[var(--color-border-subtle)] w-4'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleSkip}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                {currentStep === 'welcome' || hasSeenPrinciples ? 'Skip' : 'Skip to principles'}
              </button>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {currentStep === 'welcome' && (
                <WelcomeStep key="welcome" onNext={handleNext} onSkip={handleSkip} />
              )}
              {currentStep === 'mirror' && (
                <MirrorStep key="mirror" onNext={handleNext} />
              )}
              {currentStep === 'threads' && (
                <ThreadsStep key="threads" onNext={handleNext} />
              )}
              {currentStep === 'world' && (
                <WorldStep key="world" onNext={handleNext} />
              )}
              {currentStep === 'principles' && (
                <PrinciplesStep key="principles" onNext={handleNext} />
              )}
              {currentStep === 'ready' && (
                <ReadyStep key="ready" onComplete={onComplete} />
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Step Components

function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 text-center"
    >
      <div>
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={32} className="text-[var(--color-accent-blue)]" />
        </div>
        <h2 className="mb-3">Welcome to The Mirror</h2>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto">
          A space for reflection that doesn't push, track, or optimize.
        </p>
      </div>

      <Card variant="emphasis" className="text-left">
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          This is <strong>not</strong>:
        </p>
        <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
          <li>• A productivity tool</li>
          <li>• A social network</li>
          <li>• A therapy app</li>
          <li>• An AI assistant</li>
        </ul>
        <p className="text-sm text-[var(--color-text-secondary)] mt-3">
          It's a place where thought can exist without pressure.
        </p>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button variant="ghost" onClick={onSkip}>
          Enter now
        </Button>
        <Button variant="primary" onClick={onNext}>
          Show me around
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

function MirrorStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/20">
          <Sparkles size={24} className="text-[var(--color-accent-blue)]" />
        </div>
        <div>
          <h3>The Mirror</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Your reflection space</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          The Mirror is where you write. That's it.
        </p>

        <Card>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Check size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block mb-1">No prompts</strong>
                <p className="text-[var(--color-text-muted)]">
                  The Mirror doesn't tell you what to write about
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block mb-1">No streaks</strong>
                <p className="text-[var(--color-text-muted)]">
                  Write when you want, not because you "should"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block mb-1">Mirrorbacks are optional</strong>
                <p className="text-[var(--color-text-muted)]">
                  The AI can reflect back if you ask, but it never interrupts
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
        <ChevronRight size={16} className="ml-2" />
      </Button>
    </motion.div>
  );
}

function ThreadsStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/20">
          <TrendingUp size={24} className="text-[var(--color-accent-blue)]" />
        </div>
        <div>
          <h3>Threads</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Evolution over time</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Threads show how your thinking evolves, not how you "progress."
        </p>

        <Card>
          <div className="space-y-3 text-sm">
            <p className="text-[var(--color-text-secondary)]">
              <strong>Threads don't have completion states.</strong> They're not tasks to finish. 
              They're ongoing conversations with yourself about recurring themes.
            </p>
            <p className="text-[var(--color-text-muted)]">
              Contradictions are visible, not flagged as errors. Your mind is allowed to change.
            </p>
          </div>
        </Card>
      </div>

      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
        <ChevronRight size={16} className="ml-2" />
      </Button>
    </motion.div>
  );
}

function WorldStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/20">
          <Eye size={24} className="text-[var(--color-accent-blue)]" />
        </div>
        <div>
          <h3>The World</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Witnessing others</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          The World (Commons) is where you can choose to share reflections and witness others.
        </p>

        <Card>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <X size={16} className="text-[var(--color-border-error)] mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block mb-1 text-[var(--color-border-error)]">No likes</strong>
                <p className="text-[var(--color-text-muted)]">Only witnessing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <X size={16} className="text-[var(--color-border-error)] mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block mb-1 text-[var(--color-border-error)]">No follower counts</strong>
                <p className="text-[var(--color-text-muted)]">No popularity metrics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <X size={16} className="text-[var(--color-border-error)] mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block mb-1 text-[var(--color-border-error)]">No algorithm</strong>
                <p className="text-[var(--color-text-muted)]">Temporal ordering only</p>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-sm text-[var(--color-text-muted)]">
          Sharing is optional. Your private reflections stay private.
        </p>
      </div>

      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
        <ChevronRight size={16} className="ml-2" />
      </Button>
    </motion.div>
  );
}

function PrinciplesStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center mx-auto mb-4">
          <Info size={32} className="text-[var(--color-accent-blue)]" />
        </div>
        <h3 className="mb-2">Constitutional Principles</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          The Mirror operates on a set of unchangeable principles
        </p>
      </div>

      <div className="space-y-3">
        <PrincipleCard
          title="The UI waits, it doesn't pull"
          description="Nothing here demands your attention or creates urgency"
        />
        <PrincipleCard
          title="The system allows, it doesn't direct"
          description="You choose your path. There's no 'correct' way to use this"
        />
        <PrincipleCard
          title="No rewards or gamification"
          description="No points, badges, streaks, or completion metrics"
        />
        <PrincipleCard
          title="You own your data"
          description="Everything stays on your device. Export or delete anytime"
        />
      </div>

      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <p className="text-xs text-[var(--color-text-secondary)]">
            These principles cannot be changed by updates or features. They're constitutional 
            constraints that govern everything The Mirror does.
          </p>
        </div>
      </Card>

      <Button variant="primary" onClick={onNext} className="w-full">
        I understand
        <ChevronRight size={16} className="ml-2" />
      </Button>
    </motion.div>
  );
}

function ReadyStep({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 text-center"
    >
      <div>
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-green)]/20 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-[var(--color-accent-green)]" />
        </div>
        <h2 className="mb-3">You're ready</h2>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto">
          The Mirror is yours to use as you wish.
        </p>
      </div>

      <Card>
        <p className="text-sm text-[var(--color-text-secondary)]">
          There's no next step. No task to complete. No onboarding checklist.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          When you're ready to reflect, the Mirror will be here.
        </p>
      </Card>

      <Button variant="primary" onClick={onComplete} className="w-full">
        Enter The Mirror
      </Button>
    </motion.div>
  );
}

// Helper Component

function PrincipleCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <Check size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="text-sm font-medium mb-1">{title}</h5>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export type { OnboardingStep };


