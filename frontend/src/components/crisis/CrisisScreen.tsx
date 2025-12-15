import { useState } from 'react';
import { Heart, Phone, Wind, FileText, X } from 'lucide-react';
import { SupportResources } from '../SupportResources';
import { PauseAndGround } from '../PauseAndGround';
import { SafetyPlan } from '../SafetyPlan';
import { motion } from 'framer-motion';

type ViewMode = 'home' | 'resources' | 'ground' | 'plan';

export function CrisisScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');

  return (
    <div className="min-h-screen bg-[var(--color-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {viewMode === 'home' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1>You're here</h1>
              <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
                That's enough for right now. You don't have to solve anything. 
                You can just be here, and that's okay.
              </p>
            </div>

            {/* Immediate support callout */}
            <div className="p-6 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 text-center">
              <h3 className="mb-2">If this moment feels urgent</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                988 Suicide & Crisis Lifeline — 24/7, free, confidential
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="tel:988"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-accent-gold)] text-black hover:bg-[var(--color-accent-gold)]/90 transition-colors"
                >
                  <Phone size={18} />
                  Call 988
                </a>
                <a
                  href="sms:741741?body=HELLO"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-accent-gold)] transition-colors"
                >
                  Text 741741
                </a>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setViewMode('ground')}
                className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left group"
              >
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block group-hover:bg-[var(--color-accent-gold)]/30 transition-colors">
                  <Wind size={24} className="text-[var(--color-accent-gold)]" />
                </div>
                <h3 className="mb-2">Pause & Ground</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Breathing, grounding, finding solid ground right now
                </p>
              </button>

              <button
                onClick={() => setViewMode('resources')}
                className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left group"
              >
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block group-hover:bg-[var(--color-accent-gold)]/30 transition-colors">
                  <Phone size={24} className="text-[var(--color-accent-gold)]" />
                </div>
                <h3 className="mb-2">Support Resources</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Hotlines, crisis text lines, peer support
                </p>
              </button>

              <button
                onClick={() => setViewMode('plan')}
                className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left group"
              >
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block group-hover:bg-[var(--color-accent-gold)]/30 transition-colors">
                  <FileText size={24} className="text-[var(--color-accent-gold)]" />
                </div>
                <h3 className="mb-2">Safety Plan</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Your personal plan for when things get hard
                </p>
              </button>
            </div>

            {/* Exit */}
            <div className="text-center pt-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                <X size={16} />
                Return to Mirror
              </a>
            </div>

            {/* Spacer for breathing room */}
            <div className="h-16" />
          </motion.div>
        )}

        {viewMode === 'resources' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <SupportResources
              onClose={() => setViewMode('home')}
            />
          </motion.div>
        )}

        {viewMode === 'ground' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <PauseAndGround
              onComplete={() => setViewMode('home')}
              onSkip={() => setViewMode('home')}
            />
          </motion.div>
        )}

        {viewMode === 'plan' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <SafetyPlan
              onSave={(plan) => {
                console.log('Safety plan saved:', plan);
                // In production, save to local storage
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
