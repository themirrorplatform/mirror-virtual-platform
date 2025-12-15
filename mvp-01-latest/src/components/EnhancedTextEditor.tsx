import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Eye, EyeOff, Maximize2, Minimize2, Sun, Moon, Sparkles } from 'lucide-react';

// Enhanced text editor with constitutional features
// Focus modes, reading time, word count, zen mode, etc.

interface EnhancedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  autoFocus?: boolean;
  showMetadata?: boolean;
  onRequestMirrorback?: () => void;
  className?: string;
}

type FocusMode = 'normal' | 'zen' | 'fullscreen';
type Theme = 'dark' | 'sepia';

export function EnhancedTextEditor({
  value,
  onChange,
  placeholder = '...',
  minHeight = 500,
  maxHeight = 800,
  autoFocus = true,
  showMetadata = true,
  onRequestMirrorback,
  className = '',
}: EnhancedTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('normal');
  const [theme, setTheme] = useState<Theme>('dark');
  const [showWordCount, setShowWordCount] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Metadata calculations
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const lineCount = value.split('\n').length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  const paragraphCount = value.split(/\n\n+/).filter(p => p.trim()).length;

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zen mode toggle (⌘.)
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setFocusMode(prev => prev === 'zen' ? 'normal' : 'zen');
      }

      // Fullscreen toggle (⌘⇧F)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setFocusMode(prev => prev === 'fullscreen' ? 'normal' : 'fullscreen');
      }

      // Toggle word count (⌘⇧W)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'w') {
        e.preventDefault();
        setShowWordCount(prev => !prev);
      }

      // Request mirrorback (⌘M)
      if ((e.metaKey || e.ctrlKey) && e.key === 'm' && onRequestMirrorback) {
        e.preventDefault();
        onRequestMirrorback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRequestMirrorback]);

  // Handle fullscreen
  useEffect(() => {
    if (focusMode === 'fullscreen') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [focusMode]);

  const isZenOrFullscreen = focusMode === 'zen' || focusMode === 'fullscreen';

  return (
    <>
      {/* Fullscreen overlay */}
      <AnimatePresence>
        {focusMode === 'fullscreen' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            <div className="h-full flex items-center justify-center p-12">
              <EnhancedTextEditorContent
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                isFocused={isFocused}
                setIsFocused={setIsFocused}
                textareaRef={textareaRef}
                theme={theme}
                isZenOrFullscreen={true}
                showMetadata={showMetadata && showWordCount}
                wordCount={wordCount}
                charCount={charCount}
                readingTime={readingTime}
                lineCount={lineCount}
                paragraphCount={paragraphCount}
                focusMode={focusMode}
                setFocusMode={setFocusMode}
                setTheme={setTheme}
                setShowWordCount={setShowWordCount}
                showWordCount={showWordCount}
                minHeight={minHeight}
                maxHeight={maxHeight}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal/Zen mode */}
      {focusMode !== 'fullscreen' && (
        <EnhancedTextEditorContent
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          textareaRef={textareaRef}
          theme={theme}
          isZenOrFullscreen={isZenOrFullscreen}
          showMetadata={showMetadata && showWordCount}
          wordCount={wordCount}
          charCount={charCount}
          readingTime={readingTime}
          lineCount={lineCount}
          paragraphCount={paragraphCount}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          setTheme={setTheme}
          setShowWordCount={setShowWordCount}
          showWordCount={showWordCount}
          className={className}
          minHeight={minHeight}
          maxHeight={maxHeight}
        />
      )}
    </>
  );
}

interface EnhancedTextEditorContentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  theme: Theme;
  isZenOrFullscreen: boolean;
  showMetadata: boolean;
  wordCount: number;
  charCount: number;
  readingTime: number;
  lineCount: number;
  paragraphCount: number;
  focusMode: FocusMode;
  setFocusMode: (mode: FocusMode) => void;
  setTheme: (theme: Theme) => void;
  setShowWordCount: (show: boolean) => void;
  showWordCount: boolean;
  className?: string;
  minHeight: number;
  maxHeight: number;
}

function EnhancedTextEditorContent({
  value,
  onChange,
  placeholder,
  isFocused,
  setIsFocused,
  textareaRef,
  theme,
  isZenOrFullscreen,
  showMetadata,
  wordCount,
  charCount,
  readingTime,
  lineCount,
  paragraphCount,
  focusMode,
  setFocusMode,
  setTheme,
  setShowWordCount,
  showWordCount,
  className,
  minHeight,
  maxHeight,
}: EnhancedTextEditorContentProps) {
  const containerBg = theme === 'sepia' 
    ? 'bg-[#F5F1E8]/10'
    : 'bg-[var(--color-surface-card)]/40';

  const textColor = theme === 'sepia'
    ? 'text-[#5C4A3A]'
    : 'text-[var(--color-text-primary)]';

  return (
    <motion.div
      layout
      className={`relative w-full ${focusMode === 'fullscreen' ? 'max-w-5xl' : 'max-w-4xl'} mx-auto ${className}`}
    >
      {/* Focus glow */}
      <AnimatePresence>
        {isFocused && !isZenOrFullscreen && (
          <motion.div
            className="absolute -inset-6 rounded-[2.5rem] opacity-30 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(203, 163, 93, 0.25), transparent 70%)'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Toolbar - only in normal mode */}
      <AnimatePresence>
        {!isZenOrFullscreen && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-16 left-0 right-0 flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWordCount(!showWordCount)}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
                aria-label={showWordCount ? 'Hide word count' : 'Show word count'}
              >
                {showWordCount ? <EyeOff size={16} className="text-[var(--color-text-muted)]" /> : <Eye size={16} className="text-[var(--color-text-muted)]" />}
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'sepia' : 'dark')}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
                aria-label={theme === 'dark' ? 'Switch to sepia' : 'Switch to dark'}
              >
                {theme === 'dark' ? <Moon size={16} className="text-[var(--color-text-muted)]" /> : <Sun size={16} className="text-[var(--color-text-muted)]" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFocusMode('zen')}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
                aria-label="Zen mode"
                title="Zen mode (⌘.)"
              >
                <Minimize2 size={16} className="text-[var(--color-text-muted)]" />
              </button>
              <button
                onClick={() => setFocusMode('fullscreen')}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
                aria-label="Fullscreen"
                title="Fullscreen (⌘⇧F)"
              >
                <Maximize2 size={16} className="text-[var(--color-text-muted)]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main editor */}
      <div className={`relative rounded-3xl overflow-hidden border border-[var(--color-border-subtle)] backdrop-blur-xl ${containerBg} shadow-ambient-lg`}>
        {/* Shimmer effect */}
        {!isZenOrFullscreen && (
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: `linear-gradient(
                120deg,
                transparent 0%,
                rgba(203, 163, 93, 0.1) 50%,
                transparent 100%
              )`
            }}
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`relative w-full ${isZenOrFullscreen ? 'px-16 py-12' : 'px-12 py-10'} bg-transparent ${textColor} placeholder:text-[var(--color-text-muted)] focus:outline-none resize-none`}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: focusMode === 'fullscreen' ? '1.375rem' : '1.25rem',
            lineHeight: '2',
            letterSpacing: '0.01em',
            minHeight: `${minHeight}px`,
            maxHeight: focusMode === 'fullscreen' ? 'none' : `${maxHeight}px`,
          }}
          aria-label="Reflection field"
        />

        {/* Metadata bar - bottom */}
        <AnimatePresence>
          {showMetadata && wordCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-emphasis)]/40 px-12 py-4 flex items-center justify-between text-xs text-[var(--color-text-muted)]"
            >
              <div className="flex items-center gap-8">
                <span className="font-mono">{wordCount.toLocaleString()} words</span>
                <span className="font-mono">{charCount.toLocaleString()} characters</span>
                <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                <span>{paragraphCount} {paragraphCount === 1 ? 'paragraph' : 'paragraphs'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>{readingTime} min read</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exit zen/fullscreen hint */}
      <AnimatePresence>
        {isZenOrFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-[var(--color-text-muted)] flex items-center gap-2"
          >
            <kbd className="px-2 py-1 rounded-md bg-[var(--color-surface-emphasis)] text-[var(--color-text-muted)]">Esc</kbd>
            <span>to exit {focusMode}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
