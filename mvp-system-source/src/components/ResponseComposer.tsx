import { useState } from 'react';
import { Textarea } from './Input';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';

interface ResponseComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (response: string, isAnonymous: boolean) => void;
  originalContent: string;
}

export function ResponseComposer({
  isOpen,
  onClose,
  onSubmit,
  originalContent,
}: ResponseComposerProps) {
  const [response, setResponse] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(true);

  const handleSubmit = () => {
    if (!response.trim()) return;
    onSubmit(response, isAnonymous);
    setResponse('');
    setShowReflectionPrompt(true);
    onClose();
  };

  const handleStartWriting = () => {
    setShowReflectionPrompt(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-10 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[var(--color-surface-card)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-ambient-xl"
      >
        <div className="p-12">
          <h2 className="text-2xl mb-8">Responding</h2>

          {/* Original content - for context */}
          <div className="p-6 mb-8 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <p className="text-base text-[var(--color-text-secondary)] leading-[1.8]">
              {originalContent.slice(0, 200)}
              {originalContent.length > 200 ? '...' : ''}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {showReflectionPrompt ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="p-8 rounded-2xl bg-[var(--color-base-raised)] border-2 border-[var(--color-accent-gold)]/30">
                  <p className="text-base text-[var(--color-text-secondary)] mb-6 leading-[1.8]">
                    Before responding, you might notice:
                  </p>
                  <ul className="space-y-3 text-base text-[var(--color-text-muted)] leading-[1.7]">
                    <li>• What this reflection stirs in you</li>
                    <li>• Whether you're responding to help or to be seen</li>
                    <li>• What you're assuming about the author's intent</li>
                  </ul>
                </div>

                <Button
                  variant="primary"
                  onClick={handleStartWriting}
                  className="w-full"
                >
                  Continue to respond
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="composer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <Textarea
                  value={response}
                  onChange={setResponse}
                  placeholder="What this brings up for you..."
                  rows={10}
                  autoFocus
                />

                {/* Anonymous toggle */}
                <label className="flex items-center gap-3 text-base text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded border-[var(--color-border-subtle)] bg-transparent"
                  />
                  <span>Respond anonymously</span>
                </label>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!response.trim()}
                  >
                    Submit response
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}