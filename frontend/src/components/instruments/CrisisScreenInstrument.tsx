/**
 * Crisis Screen Instrument
 * Immediate crisis support with real resources
 * Constitutional harm prevention
 */

import { motion } from 'framer-motion';
import { Heart, Phone, MessageCircle, Shield, ExternalLink, X } from 'lucide-react';

interface CrisisResource {
  id: string;
  name: string;
  phone: string;
  text?: string;
  web?: string;
  description: string;
  availability: string;
}

interface CrisisScreenInstrumentProps {
  onClose: () => void;
  onPauseAndGround?: () => void;
  onSafetyPlan?: () => void;
}

export function CrisisScreenInstrument({
  onClose,
  onPauseAndGround,
  onSafetyPlan,
}: CrisisScreenInstrumentProps) {
  const crisisResources: CrisisResource[] = [
    {
      id: '988',
      name: '988 Suicide & Crisis Lifeline',
      phone: '988',
      text: '988',
      web: 'https://988lifeline.org',
      description: 'Free, confidential support for people in distress',
      availability: '24/7',
    },
    {
      id: 'crisis-text',
      name: 'Crisis Text Line',
      phone: '',
      text: 'Text HOME to 741741',
      web: 'https://www.crisistextline.org',
      description: 'Free 24/7 support via text message',
      availability: '24/7',
    },
    {
      id: 'iasp',
      name: 'International Association for Suicide Prevention',
      phone: '',
      text: '',
      web: 'https://www.iasp.info/resources/Crisis_Centres',
      description: 'Global directory of crisis centers',
      availability: 'Varies by region',
    },
    {
      id: 'trevor',
      name: 'The Trevor Project (LGBTQ Youth)',
      phone: '1-866-488-7386',
      text: 'Text START to 678-678',
      web: 'https://www.thetrevorproject.org',
      description: 'Crisis support for LGBTQ young people',
      availability: '24/7',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Heart size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Crisis Support</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  You're not alone. Real people are ready to help right now.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Immediate actions */}
          {(onPauseAndGround || onSafetyPlan) && (
            <div className="grid grid-cols-2 gap-4">
              {onPauseAndGround && (
                <button
                  onClick={onPauseAndGround}
                  className="p-6 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-500/50 text-left transition-all group"
                >
                  <Shield size={24} className="text-blue-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Pause & Ground</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Guided grounding exercise to help right now
                  </p>
                </button>
              )}
              {onSafetyPlan && (
                <button
                  onClick={onSafetyPlan}
                  className="p-6 rounded-xl bg-green-500/10 border-2 border-green-500/30 hover:border-green-500/50 text-left transition-all group"
                >
                  <Heart size={24} className="text-green-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Safety Plan</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Your personalized plan for difficult moments
                  </p>
                </button>
              )}
            </div>
          )}

          {/* Crisis resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">24/7 Crisis Support</h3>
            <div className="space-y-4">
              {crisisResources.map((resource) => (
                <div
                  key={resource.id}
                  className="p-6 rounded-xl bg-[var(--color-surface-card)] border-2 border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                        {resource.name}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                        {resource.description}
                      </p>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Available: {resource.availability}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {resource.phone && (
                      <a
                        href={`tel:${resource.phone}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 hover:border-green-500/50 text-green-400 transition-all"
                      >
                        <Phone size={16} />
                        <span className="text-sm font-medium">Call: {resource.phone}</span>
                      </a>
                    )}
                    {resource.text && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                        <MessageCircle size={16} />
                        <span className="text-sm font-medium">{resource.text}</span>
                      </div>
                    )}
                    {resource.web && (
                      <a
                        href={resource.web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 text-purple-400 transition-all"
                      >
                        <ExternalLink size={16} />
                        <span className="text-sm font-medium">Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Constitutional note */}
          <div className="p-6 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <h4 className="text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
              Constitutional Note
            </h4>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              The Mirror cannot provide crisis counseling or medical advice. These are real crisis services
              staffed by trained professionals. This is harm prevention, not reflection. Your safety comes first.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
          >
            Return to Mirror
          </button>
        </div>
      </div>
    </div>
  );
}

