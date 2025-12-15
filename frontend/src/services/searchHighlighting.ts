/**
 * Search Highlighting Service
 * 
 * Constitutional Principles:
 * - Subtle highlighting (not garish)
 * - Respects constitutional aesthetics
 * - Helps user understand matches
 * - Clean, readable results
 */

export interface HighlightedText {
  segments: Array<{
    text: string;
    isHighlight: boolean;
  }>;
}

class SearchHighlightingService {
  /**
   * Highlight search terms in text
   */
  highlight(text: string, searchTerms: string[]): HighlightedText {
    if (searchTerms.length === 0) {
      return { segments: [{ text, isHighlight: false }] };
    }

    const segments: Array<{ text: string; isHighlight: boolean }> = [];
    
    // Create regex for all search terms
    const pattern = searchTerms
      .map(term => this.escapeRegex(term))
      .join('|');
    
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        segments.push({
          text: text.substring(lastIndex, match.index),
          isHighlight: false,
        });
      }

      // Add highlighted match
      segments.push({
        text: match[0],
        isHighlight: true,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        isHighlight: false,
      });
    }

    return { segments };
  }

  /**
   * Extract context around matches
   */
  extractContext(
    text: string,
    searchTerms: string[],
    contextLength: number = 100
  ): string[] {
    const contexts: string[] = [];
    
    const pattern = searchTerms
      .map(term => this.escapeRegex(term))
      .join('|');
    
    const regex = new RegExp(pattern, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - contextLength);
      const end = Math.min(text.length, match.index + match[0].length + contextLength);
      
      let context = text.substring(start, end);
      
      // Add ellipsis if truncated
      if (start > 0) context = '...' + context;
      if (end < text.length) context = context + '...';
      
      contexts.push(context);
    }

    return contexts;
  }

  /**
   * Count occurrences of search terms
   */
  countMatches(text: string, searchTerms: string[]): number {
    let count = 0;
    
    for (const term of searchTerms) {
      const regex = new RegExp(this.escapeRegex(term), 'gi');
      const matches = text.match(regex);
      count += matches ? matches.length : 0;
    }

    return count;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate CSS classes for highlighting
   * Constitutional: Subtle, not garish
   */
  getHighlightClassName(): string {
    return 'bg-[var(--color-accent-gold)]/20 rounded px-0.5';
  }
}

// Singleton instance
export const searchHighlighting = new SearchHighlightingService();
