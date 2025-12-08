/**
 * Security utilities for The Mirror Virtual Platform
 * Provides XSS protection and input sanitization
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize HTML content while preserving safe formatting
 * Only allows whitelisted tags and attributes
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  // Whitelist of allowed tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'];
  const allowedAttributes: Record<string, string[]> = {
    a: ['href', 'title', 'target'],
  };

  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

  // Basic tag validation (not a full parser, use DOMPurify for production)
  const tagPattern = /<(\/?)([\w]+)([^>]*)>/g;
  sanitized = sanitized.replace(tagPattern, (match, closing, tagName, attributes) => {
    const lowerTagName = tagName.toLowerCase();
    
    if (!allowedTags.includes(lowerTagName)) {
      return ''; // Remove disallowed tag
    }

    if (closing) {
      return `</${lowerTagName}>`;
    }

    // Sanitize attributes
    if (allowedAttributes[lowerTagName]) {
      const allowedAttrs = allowedAttributes[lowerTagName];
      const attrPattern = /(\w+)\s*=\s*["']([^"']*)["']/g;
      const sanitizedAttrs: string[] = [];

      let attrMatch;
      while ((attrMatch = attrPattern.exec(attributes)) !== null) {
        const [, attrName, attrValue] = attrMatch;
        if (allowedAttrs.includes(attrName.toLowerCase())) {
          // Additional validation for href
          if (attrName.toLowerCase() === 'href') {
            if (attrValue.match(/^(https?:\/\/|\/)/)) {
              sanitizedAttrs.push(`${attrName}="${sanitizeInput(attrValue)}"`);
            }
          } else {
            sanitizedAttrs.push(`${attrName}="${sanitizeInput(attrValue)}"`);
          }
        }
      }

      return sanitizedAttrs.length > 0
        ? `<${lowerTagName} ${sanitizedAttrs.join(' ')}>`
        : `<${lowerTagName}>`;
    }

    return `<${lowerTagName}>`;
  });

  return sanitized;
}

/**
 * Validate and sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';

  const trimmed = url.trim().toLowerCase();

  // Block dangerous URL schemes
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return '';
  }

  return url;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 * Allows alphanumeric, underscore, hyphen (3-20 chars)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Sanitize object by recursively sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Rate limiting helper for client-side
 * Prevents rapid form submissions
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 5, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(): boolean {
    const now = Date.now();
    
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Check if limit exceeded
    if (this.timestamps.length >= this.limit) {
      return false;
    }

    // Add current timestamp
    this.timestamps.push(now);
    return true;
  }

  reset(): void {
    this.timestamps = [];
  }
}

/**
 * Generate CSRF token for form submissions
 */
export function generateCSRFToken(): string {
  if (typeof window === 'undefined') return '';
  
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 */
export function storeCSRFToken(): string {
  if (typeof window === 'undefined') return '';
  
  let token = sessionStorage.getItem('csrf_token');
  
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);
  }
  
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token;
}

export default {
  sanitizeInput,
  sanitizeHTML,
  sanitizeURL,
  isValidEmail,
  isValidUsername,
  sanitizeObject,
  RateLimiter,
  generateCSRFToken,
  storeCSRFToken,
  validateCSRFToken,
};
