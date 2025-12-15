/**
 * Thread Discovery Banner
 * 
 * Constitutional Principles:
 * - One-time gentle suggestion
 * - Appears after 5 unthreaded reflections
 * - Dismissible forever
 * - Never returns after dismissal
 * - No pressure to create threads
 */

import { useState, useEffect } from 'react';
import { Link2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { threadDiscoveryService, ThreadSuggestion } from '../services/threadDiscovery';
import { useAppState } from '../hooks/useAppState';
import { Button } from './Button';
import { Card } from './Card';

export function ThreadDiscoveryBanner() {
  const { reflections, createThread } = useAppState();
  const [showBanner, setShowBanner] = useState(false);
  const [suggestions, setSuggestions] = useState<ThreadSuggestion[]>([]);

  useEffect(() => {
    const checkSuggestions = async () => {
      if (threadDiscoveryService.shouldSuggest(reflections)) {
        const threadSuggestions = await threadDiscoveryService.suggestThreads(reflections);
        if (threadSuggestions.length > 0) {
          setSuggestions(threadSuggestions);
          setShowBanner(true);
        }
      }
    };

    checkSuggestions();
  }, [reflections]);

  const handleDismiss = () => {
    threadDiscoveryService.dismiss();
    setShowBanner(false);
  };

  const handleCreateThread = async (suggestion: ThreadSuggestion) => {
    await createThread(suggestion.suggestedTitle, suggestion.reflectionIds);
    handleDismiss();
  };

  if (!showBanner || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <Card variant="emphasis" className="border-l-4 border-[var(--color-accent-blue)]">
          <div className="flex items-start gap-4">
            <Link2 
              size={20} 
              className="text-[var(--color-accent-blue)] mt-0.5 flex-shrink-0" 
            />
            
            <div className="flex-1">
              <p className="font-medium mb-1">
                {threadDiscoveryService.getSuggestionMessage()}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                {threadDiscoveryService.getDismissalMessage()}
              </p>
              
              {/* Suggestions */}
              <div className="space-y-2 mb-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleCreateThread(suggestion)}
                    className="w-full text-left p-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                  >
                    <p className="text-sm font-medium mb-1">
                      {suggestion.suggestedTitle}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {suggestion.reason}
                    </p>
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </div>

            <button
              onClick={handleDismiss}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
