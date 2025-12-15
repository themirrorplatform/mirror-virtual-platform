/**
 * SafeText - Render user content safely
 * Prevents XSS while preserving formatting
 */

import React from 'react';
import { sanitizeContent, sanitizeWithLineBreaks } from '../utils/sanitization';

interface SafeTextProps {
  content: string;
  preserveLineBreaks?: boolean;
  className?: string;
  as?: 'div' | 'p' | 'span' | 'article';
}

/**
 * Render user-generated content safely
 * 
 * Usage:
 *   <SafeText content={userInput} />
 *   <SafeText content={reflection.content} preserveLineBreaks />
 */
export function SafeText({
  content,
  preserveLineBreaks = false,
  className,
  as: Component = 'div',
}: SafeTextProps) {
  if (!content) return null;
  
  if (preserveLineBreaks) {
    // Sanitize and render with line breaks preserved
    const sanitized = sanitizeWithLineBreaks(content);
    return (
      <Component
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }
  
  // For non-HTML content, just render as text (safest)
  const sanitized = sanitizeContent(content);
  return <Component className={className}>{sanitized}</Component>;
}

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

/**
 * Render links safely
 */
export function SafeLink({
  href,
  children,
  className,
  external = false,
}: SafeLinkProps) {
  const sanitizedHref = sanitizeContent(href);
  
  return (
    <a
      href={sanitizedHref}
      className={className}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  );
}

interface SafePreviewProps {
  content: string;
  maxLength?: number;
  className?: string;
}

/**
 * Render a safe preview of content (for cards, lists, etc.)
 */
export function SafePreview({
  content,
  maxLength = 200,
  className,
}: SafePreviewProps) {
  if (!content) return null;
  
  const sanitized = sanitizeContent(content);
  const truncated = sanitized.length > maxLength
    ? sanitized.slice(0, maxLength) + '...'
    : sanitized;
  
  return <span className={className}>{truncated}</span>;
}
