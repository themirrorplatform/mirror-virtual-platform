/**
 * Markdown Editor - Rich text editing with markdown
 * 
 * Features:
 * - Markdown syntax support
 * - Live preview
 * - Formatting toolbar
 * - Keyboard shortcuts
 * - Constitutional styling
 * - No word count, no metrics
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card } from '../Card';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  showToolbar?: boolean;
  showPreview?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '...',
  minHeight = 200,
  showToolbar = true,
  showPreview = false,
  autoFocus = false,
  disabled = false,
}: MarkdownEditorProps) {
  const [showPreviewMode, setShowPreviewMode] = useState(showPreview);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const insertMarkdown = (
    before: string,
    after: string = '',
    placeholder: string = 'text'
  ) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;

    const newValue =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newValue);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatBold = () => insertMarkdown('**', '**', 'bold text');
  const formatItalic = () => insertMarkdown('*', '*', 'italic text');
  const formatLink = () => insertMarkdown('[', '](url)', 'link text');
  const formatCode = () => insertMarkdown('`', '`', 'code');
  const formatQuote = () => insertMarkdown('\n> ', '', 'quote');
  const formatList = () => insertMarkdown('\n- ', '', 'list item');
  const formatOrderedList = () => insertMarkdown('\n1. ', '', 'list item');

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          formatBold();
          break;
        case 'i':
          e.preventDefault();
          formatItalic();
          break;
        case 'k':
          e.preventDefault();
          formatLink();
          break;
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      {showToolbar && !disabled && (
        <div className="flex items-center justify-between p-2 bg-[var(--color-surface-hover)] rounded-lg">
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={Bold}
              onClick={formatBold}
              title="Bold (⌘B)"
            />
            <ToolbarButton
              icon={Italic}
              onClick={formatItalic}
              title="Italic (⌘I)"
            />
            <div className="w-px h-6 bg-[var(--color-border-subtle)] mx-1" />
            <ToolbarButton
              icon={Link}
              onClick={formatLink}
              title="Link (⌘K)"
            />
            <ToolbarButton
              icon={Code}
              onClick={formatCode}
              title="Code"
            />
            <ToolbarButton
              icon={Quote}
              onClick={formatQuote}
              title="Quote"
            />
            <div className="w-px h-6 bg-[var(--color-border-subtle)] mx-1" />
            <ToolbarButton
              icon={List}
              onClick={formatList}
              title="Bullet List"
            />
            <ToolbarButton
              icon={ListOrdered}
              onClick={formatOrderedList}
              title="Numbered List"
            />
          </div>

          <button
            onClick={() => setShowPreviewMode(!showPreviewMode)}
            className="flex items-center gap-2 px-3 py-1 rounded text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card)] transition-colors"
          >
            {showPreviewMode ? (
              <>
                <EyeOff size={14} />
                Hide Preview
              </>
            ) : (
              <>
                <Eye size={14} />
                Show Preview
              </>
            )}
          </button>
        </div>
      )}

      {/* Editor / Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className={showPreviewMode ? '' : 'md:col-span-2'}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] transition-all"
            style={{ minHeight: `${minHeight}px` }}
          />
        </div>

        {/* Preview */}
        {showPreviewMode && (
          <Card className="overflow-auto" style={{ minHeight: `${minHeight}px` }}>
            <MarkdownPreview content={value} />
          </Card>
        )}
      </div>
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
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card)]'
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

/**
 * Markdown Preview - Render markdown to HTML
 */
interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const html = parseMarkdown(content);

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Simple Markdown Parser
 * Note: In production, use a library like marked or remark
 */
function parseMarkdown(markdown: string): string {
  let html = markdown;

  // Escape HTML
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--color-accent-blue)] hover:underline">$1</a>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-sm">$1</code>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="p-4 rounded-lg bg-[var(--color-surface-hover)] overflow-x-auto"><code>$1</code></pre>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gim, '<blockquote class="border-l-4 border-[var(--color-accent-blue)] pl-4 italic text-[var(--color-text-secondary)]">$1</blockquote>');

  // Lists
  html = html.replace(/^\- (.+)$/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1">$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = '<p class="mb-4">' + html + '</p>';

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * useMarkdown Hook - Manage markdown state
 */
export function useMarkdown(initialValue: string = '') {
  const [markdown, setMarkdown] = useState(initialValue);
  const [html, setHtml] = useState('');

  useEffect(() => {
    setHtml(parseMarkdown(markdown));
  }, [markdown]);

  return {
    markdown,
    setMarkdown,
    html,
  };
}

/**
 * MarkdownHelp - Syntax reference
 */
export function MarkdownHelp() {
  return (
    <Card>
      <div className="space-y-4">
        <h3 className="font-medium mb-3">Markdown Syntax</h3>

        <div className="space-y-3 text-sm">
          <SyntaxExample
            syntax="**bold** or __bold__"
            result={<strong>bold</strong>}
          />
          <SyntaxExample
            syntax="*italic* or _italic_"
            result={<em>italic</em>}
          />
          <SyntaxExample
            syntax="[link text](url)"
            result={<a href="#" className="text-[var(--color-accent-blue)]">link text</a>}
          />
          <SyntaxExample
            syntax="`code`"
            result={<code className="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-sm">code</code>}
          />
          <SyntaxExample
            syntax="> quote"
            result={<blockquote className="border-l-4 border-[var(--color-accent-blue)] pl-4 italic">quote</blockquote>}
          />
          <SyntaxExample
            syntax="- list item"
            result={<ul className="list-disc list-inside"><li>list item</li></ul>}
          />
          <SyntaxExample
            syntax="# Heading"
            result={<h1 className="text-xl font-medium">Heading</h1>}
          />
        </div>
      </div>
    </Card>
  );
}

function SyntaxExample({ syntax, result }: { syntax: string; result: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <code className="text-xs text-[var(--color-text-muted)] font-mono">
        {syntax}
      </code>
      <div className="text-sm">{result}</div>
    </div>
  );
}

export type { MarkdownEditorProps, MarkdownPreviewProps };
