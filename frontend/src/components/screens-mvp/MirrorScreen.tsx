import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Link2, Archive } from 'lucide-react';
import { storage, Reflection } from '../../utils/storage';
import { ThreadLinker } from '../ThreadLinker';

interface MirrorScreenProps {
  aiEnabled: boolean;
  currentLayer: 'sovereign' | 'commons' | 'builder';
  activeWorldviews: string[];
}

export function MirrorScreen({ aiEnabled, currentLayer, activeWorldviews }: MirrorScreenProps) {
  const [reflectionText, setReflectionText] = useState('');
  const [currentReflectionId, setCurrentReflectionId] = useState<string | null>(null);
  const [mirrorback, setMirrorback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showThreadLinker, setShowThreadLinker] = useState(false);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [reflectionText]);

  // Detect typing pause (2-3 seconds)
  useEffect(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    if (reflectionText.trim().length > 0) {
      setIsPaused(false);
      setShowControls(false);

      pauseTimerRef.current = setTimeout(() => {
        setIsPaused(true);
        setShowControls(true);
      }, 2500); // 2.5 seconds pause detection
    } else {
      setShowControls(false);
    }

    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [reflectionText]);

  const handleReflect = async () => {
    if (!reflectionText.trim() || !aiEnabled) return;

    setIsGenerating(true);

    // Save reflection to storage
    const reflection: Reflection = {
      id: currentReflectionId || `reflection_${Date.now()}`,
      text: reflectionText,
      timestamp: new Date().toISOString(),
      layer: currentLayer,
      worldviews: activeWorldviews,
      metadata: {
        wordCount: reflectionText.split(/\s+/).length,
        hasVoice: false,
        hasVideo: false,
        isShared: false,
      },
    };

    if (!currentReflectionId) {
      setCurrentReflectionId(reflection.id);
    }

    storage.saveReflection(reflection);

    // Simulate Mirrorback generation
    setTimeout(() => {
      const responses = [
        "You might notice the weight you're carrying in that phrase.",
        "What lives beneath that uncertainty?",
        "This tension appears often. Something wants attention here.",
        "The contradiction between these two truths—both seem real.",
        "You're naming something that doesn't yet have full shape.",
        "The word 'always' appears. Is that the whole truth, or part of it?",
        "Two feelings exist here at once. Neither is wrong.",
        "Something shifted in the middle of this thought.",
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Save mirrorback
      reflection.mirrorback = {
        text: randomResponse,
        timestamp: new Date().toISOString(),
      };
      storage.saveReflection(reflection);
      
      setMirrorback(randomResponse);
      setIsGenerating(false);
    }, 1500);
  };

  const handleLink = () => {
    if (!currentReflectionId && reflectionText.trim()) {
      // Save reflection first if not saved
      const reflection: Reflection = {
        id: `reflection_${Date.now()}`,
        text: reflectionText,
        timestamp: new Date().toISOString(),
        layer: currentLayer,
        worldviews: activeWorldviews,
        metadata: {
          wordCount: reflectionText.split(/\s+/).length,
          hasVoice: false,
          hasVideo: false,
          isShared: false,
        },
      };
      setCurrentReflectionId(reflection.id);
      storage.saveReflection(reflection);
    }
    
    setShowThreadLinker(true);
  };

  const handleArchive = () => {
    if (!reflectionText.trim()) return;

    // Auto-save to archive
    if (!currentReflectionId) {
      const reflection: Reflection = {
        id: `reflection_${Date.now()}`,
        text: reflectionText,
        timestamp: new Date().toISOString(),
        layer: currentLayer,
        worldviews: activeWorldviews,
        metadata: {
          wordCount: reflectionText.split(/\s+/).length,
          hasVoice: false,
          hasVideo: false,
          isShared: false,
        },
      };
      storage.saveReflection(reflection);
      setCurrentReflectionId(reflection.id);
    }

    // Clear the field
    setReflectionText('');
    setMirrorback('');
    setCurrentReflectionId(null);
    setShowControls(false);
  };

  const handleHideMirrorback = () => {
    setMirrorback('');
  };

  const handleThreadLinked = (threadId: string) => {
    console.log('Reflection linked to thread:', threadId);
    // Could show a toast notification here
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-32 md:pt-40 pb-24 px-8">
      <div className="w-full max-w-3xl space-y-8">
        {/* Centered writing surface */}
        <div className="space-y-6">
          <textarea
            ref={textareaRef}
            value={reflectionText}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReflectionText(e.target.value)}
            placeholder="…"
            className="w-full px-0 py-0 bg-transparent border-0 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none resize-none min-h-[160px]"
            style={{
              fontSize: 'inherit',
              fontFamily: 'var(--font-serif)',
              lineHeight: '1.8',
            }}
            autoFocus
          />

          {/* Subtle action bar (fades in on pause) */}
          <AnimatePresence>
            {showControls && !mirrorback && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-5 py-3"
              >
                {/* Icon-only controls */}
                <button
                  onClick={handleReflect}
                  disabled={isGenerating || !aiEnabled}
                  className="p-3 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] hover:bg-[var(--color-surface-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Reflect"
                  title="Reflect"
                >
                  <Sparkles size={22} />
                </button>

                <button
                  onClick={handleLink}
                  className="p-3 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-card)] transition-all"
                  aria-label="Link to thread"
                  title="Link"
                >
                  <Link2 size={22} />
                </button>

                <button
                  onClick={handleArchive}
                  className="p-3 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-card)] transition-all"
                  aria-label="Archive"
                  title="Archive"
                >
                  <Archive size={22} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state for Mirrorback */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-base text-[var(--color-text-muted)] italic"
            >
              ...
            </motion.div>
          )}
        </div>

        {/* Mirrorback (appears below user text) */}
        <AnimatePresence>
          {mirrorback && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="ml-10 pl-8 border-l-2 border-[var(--color-border-subtle)] space-y-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">
                  Mirrorback
                </span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleArchive}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    Archive
                  </button>
                  <button
                    onClick={handleHideMirrorback}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    Hide
                  </button>
                </div>
              </div>
              <p
                className="text-[var(--color-text-secondary)] leading-[1.8]"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                }}
              >
                {mirrorback}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thread Linker Modal */}
      {showThreadLinker && currentReflectionId && (
        <ThreadLinker
          isOpen={showThreadLinker}
          reflectionId={currentReflectionId}
          reflectionPreview={reflectionText}
          onClose={() => setShowThreadLinker(false)}
          onLinked={handleThreadLinked}
        />
      )}
    </div>
  );
}
