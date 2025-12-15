import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Button } from './Button';

interface OnboardingProps {
  onComplete: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
}

interface OnboardingPreferences {
  enableAI: boolean;
  enableCrisisDetection: boolean;
  joinCommons: boolean;
  understandsConstitution: boolean;
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    enableAI: true,
    enableCrisisDetection: true,
    joinCommons: false,
    understandsConstitution: false,
  });

  const steps = [
    {
      id: 'welcome',
      title: 'The Mirror',
      content: (
        <div className="space-y-6">
          <p className="text-lg text-[var(--color-text-secondary)] leading-[1.8]">
            This is a space for reflection. Not optimization. Not productivity. Not self-improvement.
          </p>
          <p className="text-lg text-[var(--color-text-secondary)] leading-[1.8]">
            The Mirror reflects what is. It does not prescribe what should be.
          </p>
          <p className="text-base text-[var(--color-text-muted)] leading-[1.7]">
            What follows are choices, not requirements. You can change any of these anytime.
          </p>
        </div>
      ),
    },
    {
      id: 'constitution',
      title: 'How this works',
      content: (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <h4 className="text-lg mb-5">Core principles</h4>
            <ul className="space-y-4 text-base text-[var(--color-text-secondary)]">
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-1">•</span>
                <span className="leading-[1.7]">No engagement optimization or infinite scroll</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-1">•</span>
                <span className="leading-[1.7]">No prescriptive language ("you should" is forbidden)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-1">•</span>
                <span className="leading-[1.7]">Your data stays local unless you explicitly share it</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-1">•</span>
                <span className="leading-[1.7]">You can export or delete everything anytime</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-1">•</span>
                <span className="leading-[1.7]">Silence is the default—no notifications or urgency</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <input
              type="checkbox"
              id="constitution-check"
              checked={preferences.understandsConstitution}
              onChange={(e) => setPreferences({
                ...preferences,
                understandsConstitution: e.target.checked,
              })}
              className="w-5 h-5 rounded border-[var(--color-border-subtle)] bg-[var(--color-base)] text-[var(--color-accent-gold)] focus:ring-[var(--color-accent-gold)] focus:ring-offset-0"
            />
            <label htmlFor="constitution-check" className="text-base text-[var(--color-text-secondary)] cursor-pointer leading-[1.6]">
              I understand these principles
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'ai',
      title: 'AI Processing',
      content: (
        <div className="space-y-6">
          <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
            The Mirror can use AI to generate reflective responses (Mirrorback), detect patterns 
            across your reflections, and enable semantic search.
          </p>
          <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <h4 className="mb-5 text-base">What this means</h4>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">Your reflections are processed to understand context and themes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">Processing happens locally when possible, or via encrypted API</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">Your data is never used to train public AI models</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">You can disable this anytime in Settings</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <input
              type="checkbox"
              id="ai-check"
              checked={preferences.enableAI}
              onChange={(e) => setPreferences({
                ...preferences,
                enableAI: e.target.checked,
              })}
              className="w-5 h-5 rounded border-[var(--color-border-subtle)] bg-[var(--color-base)] text-[var(--color-accent-gold)] focus:ring-[var(--color-accent-gold)] focus:ring-offset-0"
            />
            <label htmlFor="ai-check" className="text-base text-[var(--color-text-secondary)] cursor-pointer leading-[1.6]">
              Enable AI processing (Mirrorback, patterns, search)
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'crisis',
      title: 'Crisis Support',
      content: (
        <div className="space-y-6">
          <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
            The Mirror can watch for patterns in your writing that sometimes appear when 
            someone is carrying something heavy, and offer resources.
          </p>
          <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <h4 className="mb-5 text-base">What this means</h4>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">Detection happens locally—no data is sent to external servers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">You'll see a gentle notification with crisis resources (like 988)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">You can dismiss or disable these notifications anytime</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">No one is notified—this is between you and The Mirror</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <input
              type="checkbox"
              id="crisis-check"
              checked={preferences.enableCrisisDetection}
              onChange={(e) => setPreferences({
                ...preferences,
                enableCrisisDetection: e.target.checked,
              })}
              className="w-5 h-5 rounded border-[var(--color-border-subtle)] bg-[var(--color-base)] text-[var(--color-accent-gold)] focus:ring-[var(--color-accent-gold)] focus:ring-offset-0"
            />
            <label htmlFor="crisis-check" className="text-base text-[var(--color-text-secondary)] cursor-pointer leading-[1.6]">
              Enable crisis pattern detection
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'commons',
      title: 'Commons (Optional)',
      content: (
        <div className="space-y-6">
          <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
            The Commons is a shared space where you can witness others' reflections and 
            be witnessed in return. It's optional and opt-in.
          </p>
          <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <h4 className="mb-5 text-base">What this means</h4>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">You choose what to share—nothing is automatic</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">You can share anonymously</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">No likes, no follower counts, no engagement metrics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span className="leading-[1.7]">Leaving Commons deletes all your shared content</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <input
              type="checkbox"
              id="commons-check"
              checked={preferences.joinCommons}
              onChange={(e) => setPreferences({
                ...preferences,
                joinCommons: e.target.checked,
              })}
              className="w-5 h-5 rounded border-[var(--color-border-subtle)] bg-[var(--color-base)] text-[var(--color-accent-gold)] focus:ring-[var(--color-accent-gold)] focus:ring-offset-0"
            />
            <label htmlFor="commons-check" className="text-base text-[var(--color-text-secondary)] cursor-pointer leading-[1.6]">
              Join the Commons (you can leave anytime)
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'complete',
      title: "You're ready",
      content: (
        <div className="space-y-6">
          <p className="text-lg text-[var(--color-text-secondary)] leading-[1.8]">
            The Mirror is now configured. Everything you just set can be changed in Self → Consent.
          </p>
          <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <h4 className="mb-5 text-base">Your choices</h4>
            <div className="space-y-3 text-base">
              <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">AI Processing</span>
                <span className={preferences.enableAI ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)]'}>
                  {preferences.enableAI ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">Crisis Detection</span>
                <span className={preferences.enableCrisisDetection ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)]'}>
                  {preferences.enableCrisisDetection ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--color-text-secondary)]">Commons</span>
                <span className={preferences.joinCommons ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)]'}>
                  {preferences.joinCommons ? 'Joined' : 'Not joined'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const canProceed = step !== 1 || preferences.understandsConstitution;

  return (
    <div className="min-h-screen bg-[var(--color-base)] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-10"
          >
            {/* Step indicator */}
            <div className="text-sm text-[var(--color-text-muted)] text-center">
              {step + 1} of {steps.length}
            </div>

            {/* Content */}
            <div className="space-y-8">
              <h2 className="text-2xl">{currentStep.title}</h2>
              {currentStep.content}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6">
              <button
                onClick={onSkip}
                className="text-base text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -ml-2"
              >
                Skip setup
              </button>

              <div className="flex gap-4">
                {step > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => {
                    if (isLastStep) {
                      onComplete(preferences);
                    } else {
                      setStep(step + 1);
                    }
                  }}
                  disabled={!canProceed}
                  className="flex items-center gap-3"
                >
                  {isLastStep ? (
                    <>
                      <Check size={18} />
                      Begin
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}