/**
 * Enhanced Onboarding - Complete first-launch experience
 * Step-by-step revelation of The Mirror's nature
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Globe, Wrench, ArrowRight, Check, Sparkles, Lock, Eye } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: (config: {
    mode: 'sovereign' | 'commons' | 'builder';
    hasSeenConstitution: boolean;
  }) => void;
}

type Step = 'welcome' | 'principles' | 'mode' | 'constitution' | 'ready';

export function EnhancedOnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedMode, setSelectedMode] = useState<'sovereign' | 'commons' | 'builder'>('sovereign');

  const handleComplete = () => {
    onComplete({
      mode: selectedMode,
      hasSeenConstitution: true,
    });
  };

  return (
    <div className="relative w-full h-screen bg-[#000000] overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[var(--color-accent-gold)] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {step === 'welcome' && <WelcomeStep onNext={() => setStep('principles')} />}
          {step === 'principles' && <PrinciplesStep onNext={() => setStep('mode')} onBack={() => setStep('welcome')} />}
          {step === 'mode' && (
            <ModeStep 
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
              onNext={() => setStep('constitution')} 
              onBack={() => setStep('principles')} 
            />
          )}
          {step === 'constitution' && <ConstitutionStep onNext={() => setStep('ready')} onBack={() => setStep('mode')} />}
          {step === 'ready' && <ReadyStep mode={selectedMode} onComplete={handleComplete} onBack={() => setStep('constitution')} />}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {(['welcome', 'principles', 'mode', 'constitution', 'ready'] as Step[]).map((s, i) => (
          <motion.div
            key={s}
            className="w-2 h-2 rounded-full"
            animate={{
              background: step === s ? 'var(--color-accent-gold)' : 'rgba(255, 255, 255, 0.2)',
              scale: step === s ? 1.5 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Step 1: Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl w-full text-center"
    >
      {/* Logo reveal */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center relative"
        style={{
          background: 'radial-gradient(circle, rgba(203, 163, 93, 0.3), transparent)',
          border: '2px solid var(--color-accent-gold)',
          boxShadow: '0 0 60px rgba(203, 163, 93, 0.4)',
        }}
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="text-6xl"
        >
          🪞
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        Welcome to The Mirror
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xl text-[var(--color-text-secondary)] mb-2"
      >
        A sovereign intelligence for reflection
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-[var(--color-text-muted)] mb-12"
      >
        ...
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="px-8 py-4 bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] rounded-xl flex items-center gap-3 mx-auto"
      >
        <span>Enter</span>
        <ArrowRight size={20} />
      </motion.button>
    </motion.div>
  );
}

// Step 2: Core Principles
function PrinciplesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const principles = [
    { icon: <Lock size={24} />, title: 'Sovereign', description: 'Your data never leaves your device unless you explicitly choose' },
    { icon: <Eye size={24} />, title: 'Reflective', description: 'The Mirror shows, it never directs or optimizes' },
    { icon: <Sparkles size={24} />, title: 'Constitutional', description: 'Governed by principles that protect you from manipulation' },
  ];

  return (
    <motion.div
      key="principles"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="max-w-3xl w-full"
    >
      <div className="text-center mb-12">
        <h1 className="mb-4">What is The Mirror?</h1>
        <p className="text-[var(--color-text-secondary)]">
          Not a chatbot. Not an assistant. A reflection.
        </p>
      </div>

      <div className="grid gap-6 mb-12">
        {principles.map((principle, i) => (
          <motion.div
            key={principle.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="p-6 rounded-2xl backdrop-blur-md flex items-start gap-4"
            style={{
              background: 'rgba(203, 163, 93, 0.05)',
              border: '1px solid rgba(203, 163, 93, 0.2)',
            }}
          >
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(203, 163, 93, 0.2)',
                color: 'var(--color-accent-gold)',
              }}
            >
              {principle.icon}
            </div>
            <div>
              <h3 className="mb-2">{principle.title}</h3>
              <p className="text-[var(--color-text-secondary)]">{principle.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-white/20 transition-all"
        >
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="flex-1 px-6 py-3 bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] rounded-xl flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Step 3: Mode Selection
function ModeStep({ 
  selectedMode, 
  onModeChange, 
  onNext, 
  onBack 
}: { 
  selectedMode: 'sovereign' | 'commons' | 'builder';
  onModeChange: (mode: 'sovereign' | 'commons' | 'builder') => void;
  onNext: () => void; 
  onBack: () => void;
}) {
  const modes = [
    {
      id: 'sovereign' as const,
      icon: <Shield size={24} />,
      title: 'Sovereign',
      subtitle: 'Complete privacy',
      description: 'Everything stays local. No data ever shared.',
      color: 'rgba(203, 163, 93, 0.6)',
      features: ['All processing on your device', 'Zero data sharing', 'Full control', 'Enable Commons later if desired'],
    },
    {
      id: 'commons' as const,
      icon: <Globe size={24} />,
      title: 'Sovereign + Commons',
      subtitle: 'Private + Collective',
      description: 'Local reflection with optional collective evolution',
      color: 'rgba(147, 112, 219, 0.6)',
      features: ['Everything from Sovereign', 'Contribute anonymized patterns', 'Receive evolution proposals', 'Collective learning'],
    },
    {
      id: 'builder' as const,
      icon: <Wrench size={24} />,
      title: 'Builder',
      subtitle: 'Experimental',
      description: 'Advanced controls for experimentation',
      color: 'rgba(64, 224, 208, 0.6)',
      features: ['Access experimental features', 'Fork and test variants', 'Sandbox mode', 'Direct learning controls'],
    },
  ];

  return (
    <motion.div
      key="mode"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="max-w-4xl w-full"
    >
      <div className="text-center mb-8">
        <h1 className="mb-2">Choose Your Layer</h1>
        <p className="text-[var(--color-text-secondary)]">
          You can change this at any time
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onModeChange(mode.id)}
            className="w-full text-left p-6 rounded-2xl backdrop-blur-md transition-all"
            style={{
              background: selectedMode === mode.id ? `${mode.color}15` : 'rgba(255, 255, 255, 0.02)',
              border: `2px solid ${selectedMode === mode.id ? mode.color : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: selectedMode === mode.id ? `0 0 30px ${mode.color}40` : 'none',
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: selectedMode === mode.id ? mode.color : 'rgba(255, 255, 255, 0.1)',
                  color: selectedMode === mode.id ? '#000' : mode.color,
                }}
              >
                {mode.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="mb-0">{mode.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{mode.subtitle}</p>
                  </div>
                  
                  <motion.div
                    animate={{
                      scale: selectedMode === mode.id ? 1 : 0.9,
                      borderColor: selectedMode === mode.id ? mode.color : 'rgba(255, 255, 255, 0.2)',
                    }}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  >
                    {selectedMode === mode.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 rounded-full"
                        style={{ background: mode.color }}
                      />
                    )}
                  </motion.div>
                </div>
                
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {mode.description}
                </p>
                
                <ul className="grid grid-cols-2 gap-2">
                  {mode.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                      <span style={{ color: mode.color }}>•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-white/20 transition-all"
        >
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="flex-1 px-6 py-3 bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] rounded-xl flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Step 4: Constitutional Preview
function ConstitutionStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const principles = [
    'The Mirror serves you, never a platform',
    'Reflection without judgment or agenda',
    'Your sovereignty is absolute',
    'No gamification or manipulation',
    'Silence over prescription',
  ];

  return (
    <motion.div
      key="constitution"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="max-w-2xl w-full"
    >
      <div className="text-center mb-12">
        <h1 className="mb-4">The Constitution</h1>
        <p className="text-[var(--color-text-secondary)]">
          These principles govern how The Mirror behaves
        </p>
      </div>

      <div className="space-y-3 mb-12">
        {principles.map((principle, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(203, 163, 93, 0.05)',
              border: '1px solid rgba(203, 163, 93, 0.1)',
            }}
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: 'rgba(203, 163, 93, 0.3)',
                color: 'var(--color-accent-gold)',
              }}
            >
              <Check size={14} />
            </div>
            <p className="text-[var(--color-text-secondary)]">{principle}</p>
          </motion.div>
        ))}
      </div>

      <div 
        className="p-6 rounded-xl mb-8"
        style={{
          background: 'rgba(203, 163, 93, 0.05)',
          border: '1px solid rgba(203, 163, 93, 0.2)',
        }}
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          You can read the full Constitution at any time by summoning the Constitutional Viewer (⌘K → "constitution")
        </p>
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-white/20 transition-all"
        >
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="flex-1 px-6 py-3 bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] rounded-xl flex items-center justify-center gap-2"
        >
          <span>I Understand</span>
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Step 5: Ready
function ReadyStep({ 
  mode, 
  onComplete, 
  onBack 
}: { 
  mode: 'sovereign' | 'commons' | 'builder';
  onComplete: () => void; 
  onBack: () => void;
}) {
  const modeLabels = {
    sovereign: 'Sovereign',
    commons: 'Sovereign + Commons',
    builder: 'Builder',
  };

  return (
    <motion.div
      key="ready"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-2xl w-full text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center text-5xl"
        style={{
          background: 'radial-gradient(circle, rgba(203, 163, 93, 0.3), transparent)',
          border: '2px solid var(--color-accent-gold)',
          boxShadow: '0 0 60px rgba(203, 163, 93, 0.4)',
        }}
      >
        ✓
      </motion.div>

      <h1 className="mb-4">You're Ready</h1>
      
      <p className="text-xl text-[var(--color-text-secondary)] mb-2">
        You've chosen <span style={{ color: 'var(--color-accent-gold)' }}>{modeLabels[mode]}</span>
      </p>
      
      <p className="text-[var(--color-text-muted)] mb-12">
        Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘K</kbd> anytime to summon instruments
      </p>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-white/20 transition-all"
        >
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="flex-1 px-8 py-4 bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] rounded-xl flex items-center justify-center gap-2"
        >
          <span>Begin Reflection</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
