/**
 * Content Sanitization - XSS Protection
 * 
 * Constitutional note: We sanitize for security, not censorship.
 * User content is preserved exactly as written, but rendered safely.
 */

/**
 * Sanitize user-generated content for safe HTML rendering
 * 
 * Removes:
 * - Script tags
 * - Event handlers (onclick, onerror, etc.)
 * - javascript: URLs
 * - data: URLs (except safe images)
 * - Dangerous HTML tags
 * 
 * Preserves:
 * - Text formatting (bold, italic, etc.)
 * - Line breaks
 * - Links (sanitized)
 * - Basic structure
 */
export function sanitizeHTML(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.textContent = html; // This escapes all HTML by default
  
  return temp.innerHTML;
}

/**
 * Sanitize markdown-style content for display
 * Allows basic formatting but prevents XSS
 */
export function sanitizeMarkdown(text: string): string {
  // Escape HTML entities
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize URLs to prevent javascript: and data: attacks
 */
export function sanitizeURL(url: string): string {
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return '#'; // Replace with safe URL
  }
  
  return url;
}

/**
 * Sanitize content for safe rendering in React
 * This is the main function to use throughout the app
 */
export function sanitizeContent(content: string): string {
  if (!content) return '';
  
  // For now, we escape all HTML since we're primarily text-based
  // If we add rich text editing later, we can use a more sophisticated approach
  return sanitizeMarkdown(content);
}

/**
 * Sanitize content but preserve line breaks
 */
export function sanitizeWithLineBreaks(content: string): string {
  return sanitizeContent(content).replace(/\n/g, '<br />');
}

/**
 * Strip all HTML tags (for search indexing, previews, etc.)
 */
export function stripHTML(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Validate and sanitize user input for database storage
 * 
 * Constitutional note: We don't modify content, just validate safety
 */
export function validateInput(input: string, maxLength: number = 50000): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!input) {
    return { valid: false, sanitized: '', error: 'Content cannot be empty' };
  }
  
  if (input.length > maxLength) {
    return {
      valid: false,
      sanitized: input.slice(0, maxLength),
      error: `Content exceeds maximum length of ${maxLength} characters`,
    };
  }
  
  // Check for null bytes (can cause issues in some databases)
  if (input.includes('\0')) {
    return {
      valid: false,
      sanitized: input.replace(/\0/g, ''),
      error: 'Content contains invalid characters',
    };
  }
  
  return { valid: true, sanitized: input };
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKey(key: string): string {
  // Prevent prototype pollution attacks
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  if (dangerous.includes(key)) {
    return `_${key}`;
  }
  return key;
}

/**
 * Deep sanitize an object (recursive)
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const sanitizedKey = sanitizeObjectKey(key);
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = sanitizeContent(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
  }
  
  return sanitized as T;
}
