/**
 * Pause & Ground Instrument
 * Guided grounding exercise for crisis moments
 * Evidence-based 5-4-3-2-1 technique
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Eye, Volume2, Hand, Droplet, Heart, ChevronRight, X } from 'lucide-react';

interface PauseAndGroundInstrumentProps {
  onComplete: () => void;
  onClose: () => void;
}

export function PauseAndGroundInstrument({ onComplete, onClose }: PauseAndGroundInstrumentProps) {
  const [step, setStep] = useState(0);
  const [breathing, setBreathing] = useState(false);

  const steps = [
    { icon: Pause, title: 'Pause', text: 'You\'re safe right now. Let\'s ground together.' },
    { icon: Eye, title: '5 Things You See', text: 'Name 5 things you can see around you.' },
    { icon: Hand, title: '4 Things You Touch', text: 'Name 4 things you can feel touching your skin.' },
    { icon: Volume2, title: '3 Things You Hear', text: 'Name 3 sounds you can hear right now.' },
    { icon: Droplet, title: '2 Things You Smell', text: 'Name 2 things you can smell (or like to smell).' },
    { icon: Heart, title: '1 Deep Breath', text: 'Take one deep breath. In for 4, hold for 4, out for 4.' },
  ];

  useEffect(() => {
    if (step === steps.length - 1 && breathing) {
      const timer = setTimeout(() => setBreathing(false), 12000);
      return () => clearTimeout(timer);
    }
  }, [step, breathing]);

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  return (
    <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-12 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
          <X size={20} className="text-[var(--color-text-muted)]" />
        </button>

        <AnimatePresence mode="wait">
          <div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
              <StepIcon size={48} className="text-blue-400" />
            </div>

            <div>
              <h2 className="text-3xl font-semibold mb-4 text-[var(--color-text-primary)]">{currentStep.title}</h2>
              <p className="text-xl text-[var(--color-text-secondary)] leading-relaxed">{currentStep.text}</p>
            </div>

            {step === steps.length - 1 && breathing && (
              <div className="text-lg text-[var(--color-accent-gold)]">
                <div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: 3 }}>
                  Breathe...
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center pt-4">
              {step < steps.length - 1 ? (
                <button onClick={() => setStep(step + 1)} className="px-8 py-3 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] text-lg flex items-center gap-2">
                  Next <ChevronRight size={20} />
                </button>
              ) : !breathing ? (
                <button onClick={() => setBreathing(true)} className="px-8 py-3 rounded-xl bg-blue-500 text-white text-lg">
                  Start Breathing
                </button>
              ) : (
                <button onClick={onComplete} className="px-8 py-3 rounded-xl bg-green-500 text-white text-lg">
                  Complete
                </button>
              )}
            </div>

            <div className="flex gap-2 justify-center pt-4">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-[var(--color-accent-gold)]' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}

