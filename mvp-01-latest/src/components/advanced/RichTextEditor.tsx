/**
 * Rich Text Editor - Enhanced writing experience
 * 
 * Features:
 * - Rich formatting (bold, italic, lists)
 * - Constitutional design (no word count, no metrics)
 * - Clean, distraction-free
 * - Keyboard shortcuts
 * - Auto-save support
 * - Focus mode
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card } from '../Card';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  minHeight?: number;
  showToolbar?: boolean;
  onSave?: (value: string) => void;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '...',
  autoFocus = false,
  minHeight = 300,
  showToolbar = true,
  onSave,
  readOnly = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-save on Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.(value);
      }

      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, onSave, isFullscreen]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    onChange(text);
  };

  const applyFormat = (format: string, value?: string) => {
    document.execCommand(format, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[var(--color-surface-base)] p-8'
          : ''
      }`}
    >
      {/* Toolbar */}
      <AnimatePresence>
        {showToolbar && !readOnly && (isFocused || isFullscreen) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2"
          >
            <Card variant="emphasis">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Text Formatting */}
                  <ToolbarButton
                    icon={Bold}
                    onClick={() => applyFormat('bold')}
                    title="Bold (⌘B)"
                  />
                  <ToolbarButton
                    icon={Italic}
                    onClick={() => applyFormat('italic')}
                    title="Italic (⌘I)"
                  />
                  
                  <div className="w-px h-6 bg-[var(--color-border-subtle)] mx-1" />

                  {/* Lists */}
                  <ToolbarButton
                    icon={List}
                    onClick={() => applyFormat('insertUnorderedList')}
                    title="Bullet List"
                  />
                  <ToolbarButton
                    icon={ListOrdered}
                    onClick={() => applyFormat('insertOrderedList')}
                    title="Numbered List"
                  />

                  <div className="w-px h-6 bg-[var(--color-border-subtle)] mx-1" />

                  {/* Special */}
                  <ToolbarButton
                    icon={Quote}
                    onClick={() => applyFormat('formatBlock', 'blockquote')}
                    title="Quote"
                  />
                  <ToolbarButton
                    icon={Code}
                    onClick={() => applyFormat('formatBlock', 'pre')}
                    title="Code"
                  />
                  <ToolbarButton
                    icon={LinkIcon}
                    onClick={insertLink}
                    title="Link (⌘K)"
                  />

                  <div className="w-px h-6 bg-[var(--color-border-subtle)] mx-1" />

                  <ToolbarButton
                    icon={Minus}
                    onClick={() => applyFormat('insertHorizontalRule')}
                    title="Divider"
                  />
                </div>

                <ToolbarButton
                  icon={isFullscreen ? Minimize2 : Maximize2}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full px-6 py-4 rounded-lg bg-[var(--color-surface-card)] border transition-all ${
          isFocused
            ? 'border-[var(--color-accent-blue)] ring-2 ring-[var(--color-accent-blue)]/20'
            : 'border-[var(--color-border-subtle)]'
        } ${readOnly ? 'cursor-default' : ''} focus:outline-none`}
        style={{ 
          minHeight: isFullscreen ? 'calc(100vh - 200px)' : `${minHeight}px`,
          maxWidth: isFullscreen ? '800px' : '100%',
          margin: isFullscreen ? '0 auto' : '0',
        }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
      >
        {value}
      </div>

      {/* Save Indicator */}
      {onSave && isFocused && (
        <div className="absolute bottom-4 right-4">
          <span className="text-xs text-[var(--color-text-muted)]">
            Press <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] font-mono">⌘S</kbd> to save
          </span>
        </div>
      )}

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        [contenteditable] {
          outline: none;
        }

        [contenteditable] blockquote {
          border-left: 4px solid var(--color-accent-blue);
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: var(--color-text-secondary);
        }

        [contenteditable] pre {
          background: var(--color-surface-hover);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.875rem;
        }

        [contenteditable] a {
          color: var(--color-accent-blue);
          text-decoration: underline;
        }

        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        [contenteditable] hr {
          border: none;
          border-top: 1px solid var(--color-border-subtle);
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}

// Toolbar Button

interface ToolbarButtonProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  onClick: () => void;
  title: string;
  active?: boolean;
}

function ToolbarButton({ icon: Icon, onClick, title, active = false }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-[var(--color-accent-blue)] text-white'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

/**
 * Minimal Text Editor - Simple, clean editor
 */
interface MinimalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function MinimalEditor({
  value,
  onChange,
  placeholder = '...',
  autoFocus = false,
}: MinimalEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-0 py-0 bg-transparent border-none resize-none focus:outline-none"
      style={{ minHeight: '200px' }}
    />
  );
}

/**
 * Focus Mode Editor - Distraction-free writing
 */
interface FocusModeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExit: () => void;
  placeholder?: string;
}

export function FocusModeEditor({
  value,
  onChange,
  onExit,
  placeholder = '...',
}: FocusModeEditorProps) {
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-surface-base)] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full h-[70vh] px-0 py-0 bg-transparent border-none resize-none focus:outline-none text-lg leading-relaxed"
        />
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2"
          >
            <Card className="shadow-lg">
              <p className="text-sm text-[var(--color-text-muted)]">
                Press <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] font-mono">Esc</kbd> to exit focus mode
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * useAutoSave Hook - Auto-save functionality
 */
export function useAutoSave(
  value: string,
  onSave: (value: string) => void,
  delay: number = 2000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsSaving(true);
      onSave(value);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 500);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, onSave, delay]);

  return {
    isSaving,
    lastSaved,
  };
}

/**
 * Save Indicator - Show save status
 */
interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export function SaveIndicator({ isSaving, lastSaved }: SaveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      {isSaving ? (
        <>
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent-blue)] animate-pulse" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]" />
          <span>Saved {formatTimestamp(lastSaved)}</span>
        </>
      ) : null}
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Word Counter - Optional word count display
 */
interface WordCounterProps {
  text: string;
  showCharacters?: boolean;
}

export function WordCounter({ text, showCharacters = false }: WordCounterProps) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;

  return (
    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
      <span>{words} words</span>
      {showCharacters && <span>{characters} characters</span>}
    </div>
  );
}

/**
 * Reading Time Estimator
 */
export function ReadingTime({ text }: { text: string }) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.ceil(words / 200); // Average reading speed

  if (minutes === 0) return null;

  return (
    <span className="text-xs text-[var(--color-text-muted)]">
      ~{minutes} min read
    </span>
  );
}

export type { RichTextEditorProps, MinimalEditorProps, FocusModeEditorProps };
