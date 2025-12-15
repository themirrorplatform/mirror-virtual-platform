import { useState, useEffect } from 'react';
import { Wind, Heart, Hand, Eye, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

type GroundingTechnique = '54321' | 'breathing' | 'body' | 'present';

interface PauseAndGroundProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function PauseAndGround({
  onComplete,
  onSkip,
}: PauseAndGroundProps) {
  const [selectedTechnique, setSelectedTechnique] = useState<GroundingTechnique | null>(null);
  const [breathCount, setBreathCount] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out' | 'rest'>('in');
  const [isBreathing, setIsBreathing] = useState(false);

  // Breathing cycle: 4 in, 4 hold, 6 out, 2 rest
  useEffect(() => {
    if (!isBreathing) return;

    const phases = [
      { phase: 'in', duration: 4000 },
      { phase: 'hold', duration: 4000 },
      { phase: 'out', duration: 6000 },
      { phase: 'rest', duration: 2000 },
    ] as const;

    let currentPhase = 0;
    
    const cycle = () => {
      setBreathPhase(phases[currentPhase].phase);
      
      setTimeout(() => {
        currentPhase = (currentPhase + 1) % phases.length;
        if (currentPhase === 0) {
          setBreathCount(prev => prev + 1);
        }
        if (breathCount < 5) {
          cycle();
        } else {
          setIsBreathing(false);
        }
      }, phases[currentPhase].duration);
    };

    cycle();
  }, [isBreathing, breathCount]);

  const startBreathing = () => {
    setBreathCount(0);
    setIsBreathing(true);
  };

  const stopBreathing = () => {
    setIsBreathing(false);
    setBreathCount(0);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="mb-2">Pause & Ground</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          When everything feels too much, sometimes the body knows how to find solid ground.
        </p>
      </div>

      {/* Technique selection */}
      {!selectedTechnique ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedTechnique('breathing')}
            className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left"
          >
            <div className="mb-3 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block">
              <Wind size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <h3 className="mb-1">Breathing</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Slow, counted breaths to calm the nervous system
            </p>
          </button>

          <button
            onClick={() => setSelectedTechnique('54321')}
            className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left"
          >
            <div className="mb-3 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block">
              <Eye size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <h3 className="mb-1">5-4-3-2-1</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Use your senses to return to the present moment
            </p>
          </button>

          <button
            onClick={() => setSelectedTechnique('body')}
            className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left"
          >
            <div className="mb-3 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block">
              <Hand size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <h3 className="mb-1">Body scan</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Notice sensations without trying to change them
            </p>
          </button>

          <button
            onClick={() => setSelectedTechnique('present')}
            className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left"
          >
            <div className="mb-3 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block">
              <Heart size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <h3 className="mb-1">Present moment</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Simple awareness of right now
            </p>
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Breathing exercise */}
          {selectedTechnique === 'breathing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                {/* Breathing circle */}
                <div className="relative w-48 h-48 mx-auto">
                  <motion.div
                    animate={{
                      scale: breathPhase === 'in' ? 1.5 : breathPhase === 'out' ? 0.7 : 1,
                    }}
                    transition={{
                      duration: breathPhase === 'in' ? 4 : breathPhase === 'out' ? 6 : breathPhase === 'hold' ? 4 : 2,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 rounded-full bg-[var(--color-accent-gold)]/20 border-2 border-[var(--color-accent-gold)]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl text-[var(--color-accent-gold)] mb-1 capitalize">
                        {breathPhase === 'in' ? 'Breathe in' : 
                         breathPhase === 'hold' ? 'Hold' : 
                         breathPhase === 'out' ? 'Breathe out' : 
                         'Rest'}
                      </div>
                      {isBreathing && (
                        <div className="text-sm text-[var(--color-text-muted)]">
                          Breath {breathCount + 1} of 5
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {!isBreathing ? (
                    <p>Click start when you're ready. Follow the circle's rhythm.</p>
                  ) : (
                    <p>
                      {breathPhase === 'in' && 'Fill your lungs slowly and deeply'}
                      {breathPhase === 'hold' && 'Hold the breath gently'}
                      {breathPhase === 'out' && 'Release the breath completely'}
                      {breathPhase === 'rest' && 'Pause before the next breath'}
                    </p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3 justify-center">
                {!isBreathing ? (
                  <Button variant="primary" onClick={startBreathing}>
                    Start breathing
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={stopBreathing}>
                    Stop
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedTechnique(null)}>
                  Choose different technique
                </Button>
              </div>
            </motion.div>
          )}

          {/* 5-4-3-2-1 grounding */}
          {selectedTechnique === '54321' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                <h3 className="mb-4">5-4-3-2-1 Grounding</h3>
                <div className="space-y-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <div>
                    <div className="text-[var(--color-accent-gold)] mb-1">5 things you can see</div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Look around. Name five things. A wall. A shadow. Your hand.
                    </p>
                  </div>
                  <div>
                    <div className="text-[var(--color-accent-gold)] mb-1">4 things you can touch</div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      What's the texture? Temperature? Weight?
                    </p>
                  </div>
                  <div>
                    <div className="text-[var(--color-accent-gold)] mb-1">3 things you can hear</div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Even silence has sound. Notice what's present.
                    </p>
                  </div>
                  <div>
                    <div className="text-[var(--color-accent-gold)] mb-1">2 things you can smell</div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Air. Fabric. Skin. What do you notice?
                    </p>
                  </div>
                  <div>
                    <div className="text-[var(--color-accent-gold)] mb-1">1 thing you can taste</div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Your mouth knows. What's there?
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={onComplete}>
                  I'm more present now
                </Button>
                <Button variant="ghost" onClick={() => setSelectedTechnique(null)}>
                  Choose different technique
                </Button>
              </div>
            </motion.div>
          )}

          {/* Body scan */}
          {selectedTechnique === 'body' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                <h3 className="mb-4">Body Scan</h3>
                <div className="space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <p>Start with your feet. Notice what they feel without judging it.</p>
                  <p>Move slowly up: ankles, calves, knees, thighs.</p>
                  <p>Notice your hips. Your belly. Your chest.</p>
                  <p>Shoulders. Arms. Hands. Fingers.</p>
                  <p>Your neck. Your jaw. Your face.</p>
                  <p>The top of your head.</p>
                  <p className="text-xs text-[var(--color-text-muted)] pt-2">
                    You don't need to change anything. Just notice what's there.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={onComplete}>
                  I'm here now
                </Button>
                <Button variant="ghost" onClick={() => setSelectedTechnique(null)}>
                  Choose different technique
                </Button>
              </div>
            </motion.div>
          )}

          {/* Present moment */}
          {selectedTechnique === 'present' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-8 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-center">
                <h3 className="mb-6">Present Moment</h3>
                <div className="space-y-4 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-md mx-auto">
                  <p>Right now, in this moment, are you safe?</p>
                  <p>Not yesterday. Not tomorrow. Right now.</p>
                  <p>Take a slow breath.</p>
                  <p>This moment is the only one that exists.</p>
                  <p className="text-xs text-[var(--color-text-muted)] pt-4">
                    You can handle right now. That's all you need to handle.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={onComplete}>
                  I'm here
                </Button>
                <Button variant="ghost" onClick={() => setSelectedTechnique(null)}>
                  Choose different technique
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Skip option */}
      {onSkip && (
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
