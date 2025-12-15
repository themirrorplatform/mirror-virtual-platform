/**
 * Crisis Compass - Immediate support when needed
 * Constitutional crisis support with resources and grounding
 */

import { motion } from 'framer-motion';
import { AlertCircle, Phone, Heart, Anchor, ExternalLink } from 'lucide-react';

interface CrisisCompassProps {
  onGroundingExercise?: () => void;
}

export function CrisisCompass({ onGroundingExercise }: CrisisCompassProps) {
  const resources = [
    {
      name: '988 Suicide & Crisis Lifeline',
      number: '988',
      description: '24/7 support',
      urgent: true,
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Text-based support',
      urgent: true,
    },
    {
      name: 'SAMHSA National Helpline',
      number: '1-800-662-4357',
      description: 'Mental health & substance abuse',
      urgent: false,
    },
  ];

  const groundingSteps = [
    'Name 5 things you can see',
    'Name 4 things you can touch',
    'Name 3 things you can hear',
    'Name 2 things you can smell',
    'Name 1 thing you can taste',
  ];

  return (
    <div className="space-y-6">
      {/* Immediate notice */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))',
          border: '2px solid rgba(239, 68, 68, 0.4)',
        }}
      >
        <div className="flex items-start gap-4">
          <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="text-lg text-[var(--color-text-primary)]">
              You are not alone
            </h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              If you're in immediate danger, please call emergency services or use one of the resources below. 
              This is a moment, not a conclusion.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Crisis resources */}
      <div className="space-y-3">
        <h4 className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
          Immediate Support
        </h4>
        
        {resources.map((resource, index) => (
          <motion.a
            key={resource.name}
            href={resource.number.startsWith('1-') ? `tel:${resource.number}` : undefined}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`block p-4 rounded-xl border transition-all ${
              resource.urgent
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                : 'bg-[var(--color-base-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-focus)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone size={16} className={resource.urgent ? 'text-red-400' : 'text-[var(--color-text-muted)]'} />
                  <span className="text-[var(--color-text-primary)]">
                    {resource.name}
                  </span>
                </div>
                <p className="text-lg font-mono text-[var(--color-accent-gold)]">
                  {resource.number}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {resource.description}
                </p>
              </div>
              <ExternalLink size={16} className="text-[var(--color-text-muted)]" />
            </div>
          </motion.a>
        ))}
      </div>

      {/* Grounding exercise */}
      <div className="space-y-3">
        <h4 className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
          Grounding Exercise
        </h4>

        <div className="p-6 bg-[var(--color-base-raised)] rounded-xl space-y-4">
          <div className="flex items-center gap-3 text-[var(--color-accent-cyan)]">
            <Anchor size={20} />
            <span className="text-sm">5-4-3-2-1 Technique</span>
          </div>

          <ol className="space-y-3">
            {groundingSteps.map((step, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3 text-[var(--color-text-secondary)]"
              >
                <span className="text-[var(--color-accent-cyan)] font-mono text-sm mt-0.5">
                  {index + 1}.
                </span>
                <span>{step}</span>
              </motion.li>
            ))}
          </ol>

          <button
            onClick={onGroundingExercise}
            className="w-full mt-4 px-6 py-3 bg-[var(--color-accent-cyan)]/20 hover:bg-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)] rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Heart size={18} />
            <span>Begin guided exercise</span>
          </button>
        </div>
      </div>

      {/* Return to field */}
      <p className="text-center text-sm text-[var(--color-text-muted)] pt-4">
        This instrument remains available whenever needed.
      </p>
    </div>
  );
}
