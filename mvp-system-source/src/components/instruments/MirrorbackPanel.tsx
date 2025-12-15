/**
 * Mirrorback Panel - AI reflection companion
 * Shows AI responses to user reflections
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Archive, Eye, EyeOff } from 'lucide-react';

interface MirrorbackPanelProps {
  reflectionText: string;
  onArchive?: () => void;
}

export function MirrorbackPanel({ reflectionText, onArchive }: MirrorbackPanelProps) {
  const [mirrorback, setMirrorback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Generate mirrorback when reflection changes
  useEffect(() => {
    if (!reflectionText.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const responses = [
        "This thought appears to hold tension between what is and what might be.",
        "Notice how this reflection moves between certainty and question.",
        "What emerges here seems to ask for more space to unfold.",
        "This pattern has appeared before, in different words.",
        "The question underneath the question: what does this reveal?",
      ];
      
      setMirrorback(responses[Math.floor(Math.random() * responses.length)]);
      setIsGenerating(false);
    }, 1500);
  }, [reflectionText]);

  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className="w-full p-4 bg-[var(--color-base-raised)] rounded-xl flex items-center justify-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
      >
        <Eye size={18} />
        <span className="text-sm">Show Mirrorback</span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Sparkles size={24} className="text-[var(--color-accent-violet)]" />
            </motion.div>
            <p className="mt-4 text-[var(--color-text-muted)] italic">
              ...
            </p>
          </motion.div>
        ) : mirrorback ? (
          <motion.div
            key="mirrorback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Mirrorback content */}
            <div 
              className="p-6 rounded-xl border-l-4"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 112, 219, 0.1), transparent)',
                borderColor: 'rgba(147, 112, 219, 0.5)',
              }}
            >
              <div className="flex items-center gap-2 mb-3 text-sm text-[var(--color-accent-violet)]">
                <Sparkles size={16} />
                <span>Mirrorback</span>
              </div>
              
              <p 
                className="text-[var(--color-text-secondary)] leading-relaxed italic"
                style={{
                  fontFamily: 'var(--font-serif)',
                }}
              >
                {mirrorback}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onArchive}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-base-raised)] transition-all"
              >
                <Archive size={16} />
                <span>Archive</span>
              </button>

              <button
                onClick={() => setIsHidden(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-base-raised)] transition-all"
              >
                <EyeOff size={16} />
                <span>Hide</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
