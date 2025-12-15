/**
 * Mirror Screen (Backend Integrated)
 * 
 * Core reflection interface connected to:
 * - IndexedDB for persistence
 * - MirrorOS for AI reflection
 * - State management
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Link2, Archive, Save, Loader } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState';
import { mirrorOS } from '../../services/mirrorOS';
import { autoRecoveryService } from '../../services/autoRecovery';
import { Button } from '../Button';
import { Card } from '../Card';

export function MirrorScreenIntegrated() {
  const {
    createReflection,
    currentThread,
    currentIdentityAxis,
    currentLayer,
    reflections,
  } = useAppState();

  const [reflectionText, setReflectionText] = useState('');
  const [mirrorback, setMirrorback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasRecovery, setHasRecovery] = useState(false);

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcuts (Cmd/Ctrl + Enter to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleArchive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reflectionText]);

  // Check for recovery on mount
  useEffect(() => {
    const checkRecovery = async () => {
      if (autoRecoveryService.hasRecovery()) {
        const age = autoRecoveryService.getRecoveryAge();
        if (age && age < 3600) { // Less than 1 hour old
          setHasRecovery(true);
        }
      }
    };
    checkRecovery();
  }, []);

  // Immediate recovery snapshot on typing (100ms debounced)
  useEffect(() => {
    if (reflectionText.trim().length > 0) {
      autoRecoveryService.saveSnapshot(reflectionText, {
        threadId: currentThread || undefined,
        identityAxis: currentIdentityAxis || undefined,
        modality: 'text',
      });
    }
  }, [reflectionText, currentThread, currentIdentityAxis]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [reflectionText]);

  // Pause detection
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
      }, 2500);
    } else {
      setShowControls(false);
    }

    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [reflectionText]);

  // Auto-save (constitutional: save, don't disrupt)
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (reflectionText.trim().length > 20) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true); // Silent auto-save
      }, 2500); // Reduced from 5000ms to 2500ms - save on pause
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [reflectionText]);

  // Generate Mirrorback
  const handleGenerateMirrorback = async () => {
    if (!reflectionText.trim()) return;

    setIsGenerating(true);
    setMirrorback('');

    try {
      // Create reflection object for context
      const tempReflection = {
        id: 'temp',
        content: reflectionText,
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: currentLayer,
        modality: 'text' as const,
        threadId: currentThread || undefined,
        identityAxis: currentIdentityAxis || undefined,
        isPublic: currentLayer === 'commons',
      };

      // Get recent reflections for context
      const recentReflections = reflections
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      const response = await mirrorOS.generateMirrorback(tempReflection, {
        recentReflections,
      });

      setMirrorback(response.content);
    } catch (error) {
      console.error('Failed to generate mirrorback:', error);
      setMirrorback('...');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save reflection
  const handleSave = async (silent = false) => {
    if (!reflectionText.trim()) return;

    if (!silent) setIsSaving(true);
    setSaveStatus('saving');

    try {
      await createReflection(reflectionText, {
        threadId: currentThread || undefined,
        identityAxis: currentIdentityAxis || undefined,
        modality: 'text',
      });

      setSaveStatus('saved');

      if (!silent) {
        // Clear field after explicit save (but DON'T clear mirrorback)
        setReflectionText('');
        // Don't clear mirrorback here - let it persist
      }

      // Reset save status after delay
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save reflection:', error);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  // Archive (save and clear)
  const handleArchive = async () => {
    if (!reflectionText.trim()) return;

    console.log('📝 Starting archive process...');
    
    // Save the text before clearing
    const textToReflectOn = reflectionText;
    const shouldGenerateMirrorback = textToReflectOn.trim().length > 50;

    console.log('Text length:', textToReflectOn.length);
    console.log('Will generate mirrorback:', shouldGenerateMirrorback);

    // Save and clear
    await handleSave(false);

    // Then generate mirrorback using saved text
    if (shouldGenerateMirrorback) {
      console.log('✨ Generating mirrorback...');
      setIsGenerating(true);

      try {
        // Create reflection object for context
        const tempReflection = {
          id: 'temp',
          content: textToReflectOn,
          createdAt: new Date(),
          updatedAt: new Date(),
          layer: currentLayer,
          modality: 'text' as const,
          threadId: currentThread || undefined,
          identityAxis: currentIdentityAxis || undefined,
          isPublic: currentLayer === 'commons',
        };

        // Get recent reflections for context
        const recentReflections = reflections
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);

        const response = await mirrorOS.generateMirrorback(tempReflection, {
          recentReflections,
        });

        console.log('✅ Mirrorback generated:', response.content);
        setMirrorback(response.content);
      } catch (error) {
        console.error('❌ Failed to generate mirrorback:', error);
        setMirrorback('...');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Writing Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Main textarea */}
          <textarea
            ref={textareaRef}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="..."
            className="w-full min-h-[200px] px-0 py-0 bg-transparent border-none resize-none focus:outline-none text-lg leading-relaxed"
            autoFocus
          />

          {/* Mirrorback (if generated) */}
          <AnimatePresence>
            {mirrorback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card variant="emphasis" className="border-l-4 border-[var(--color-accent-blue)]">
                  <div className="flex items-start gap-3">
                    <Sparkles size={16} className="text-[var(--color-accent-blue)] mt-1 flex-shrink-0" />
                    <p className="text-sm italic text-[var(--color-text-secondary)]">
                      {mirrorback}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Reflections (shown when field is empty) */}
          <AnimatePresence>
            {!reflectionText && reflections.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 mt-12"
              >
                <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
                  Recent
                </div>
                
                {reflections
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3)
                  .map((reflection) => (
                    <Card key={reflection.id} variant="ghost" className="p-4">
                      <p className="text-sm line-clamp-3 text-[var(--color-text-secondary)]">
                        {reflection.content}
                      </p>
                      <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                        {new Date(reflection.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </Card>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Persistent Present Button (always visible when text exists) */}
      <AnimatePresence>
        {reflectionText.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 right-8 z-20"
          >
            <Button
              variant="default"
              size="lg"
              onClick={handleArchive}
              disabled={isSaving}
              className="shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Archive size={20} />
                  Present
                </>
              )}
            </Button>
            
            {/* Keyboard hint */}
            <div className="mt-2 text-xs text-[var(--color-text-muted)] text-center">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                ⌘↵
              </kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls (appear on pause) */}
      <AnimatePresence>
        {showControls && isPaused && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
          >
            <div className="max-w-3xl mx-auto px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {/* Mirrorback Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateMirrorback}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Reflecting...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Reflect
                      </>
                    )}
                  </Button>

                  {/* Thread Link */}
                  <Button variant="ghost" size="sm">
                    <Link2 size={16} />
                    Link Thread
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save Status */}
                  {saveStatus === 'saved' && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs text-[var(--color-accent-green)] flex items-center gap-1"
                    >
                      <Archive size={12} />
                      Saved
                    </motion.span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Saving...
                    </span>
                  )}
                </div>
              </div>

              {/* Hint */}
              <div className="mt-3 text-xs text-[var(--color-text-muted)] text-center">
                Auto-saves after pause • Present to save and clear
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}