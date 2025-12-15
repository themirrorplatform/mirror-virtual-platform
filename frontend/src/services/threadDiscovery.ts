/**
 * Thread Discovery Service
 * 
 * Constitutional Principles:
 * - One-time gentle suggestion after 5 reflections
 * - Dismissible forever
 * - Never returns after dismissal
 * - Never pressures user to create threads
 */

import { Reflection } from './database';

export interface ThreadSuggestion {
  id: string;
  suggestedTitle: string;
  reflectionIds: string[];
  reason: string;
  confidence: number;
}

class ThreadDiscoveryService {
  private readonly STORAGE_KEY = 'mirror_thread_discovery_dismissed';
  private readonly MIN_REFLECTIONS = 5;

  /**
   * Check if user has dismissed thread discovery
   */
  isDismissed(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  /**
   * Dismiss thread discovery forever
   */
  dismiss(): void {
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }

  /**
   * Reset dismissal (for testing only)
   */
  reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if suggestion should be shown
   * Constitutional: Only once, after 5 reflections, if not dismissed
   */
  shouldSuggest(reflections: Reflection[]): boolean {
    if (this.isDismissed()) return false;
    
    // Only suggest if user has at least 5 reflections
    const unthreadedReflections = reflections.filter(r => !r.threadId);
    return unthreadedReflections.length >= this.MIN_REFLECTIONS;
  }

  /**
   * Generate thread suggestions
   * Constitutional: Gentle, never demanding
   */
  async suggestThreads(reflections: Reflection[]): Promise<ThreadSuggestion[]> {
    const unthreaded = reflections.filter(r => !r.threadId);
    
    if (unthreaded.length < this.MIN_REFLECTIONS) {
      return [];
    }

    const suggestions: ThreadSuggestion[] = [];

    // Suggestion 1: By identity axis
    const axisGroups = new Map<string, Reflection[]>();
    for (const r of unthreaded) {
      if (r.identityAxis) {
        if (!axisGroups.has(r.identityAxis)) {
          axisGroups.set(r.identityAxis, []);
        }
        axisGroups.get(r.identityAxis)!.push(r);
      }
    }

    for (const [axis, refs] of axisGroups.entries()) {
      if (refs.length >= 3) {
        suggestions.push({
          id: crypto.randomUUID(),
          suggestedTitle: `Reflections as ${axis}`,
          reflectionIds: refs.map(r => r.id),
          reason: `${refs.length} reflections share the "${axis}" identity`,
          confidence: Math.min(refs.length / 10, 1),
        });
      }
    }

    // Suggestion 2: By time proximity (same day)
    const dateGroups = new Map<string, Reflection[]>();
    for (const r of unthreaded) {
      const dateKey = r.createdAt.toISOString().split('T')[0];
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(r);
    }

    for (const [date, refs] of dateGroups.entries()) {
      if (refs.length >= 3) {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        
        suggestions.push({
          id: crypto.randomUUID(),
          suggestedTitle: `Reflections from ${formattedDate}`,
          reflectionIds: refs.map(r => r.id),
          reason: `${refs.length} reflections from the same day`,
          confidence: 0.7,
        });
      }
    }

    // Suggestion 3: By length similarity (similar depth)
    const longReflections = unthreaded.filter(r => r.content.length > 500);
    if (longReflections.length >= 3) {
      suggestions.push({
        id: crypto.randomUUID(),
        suggestedTitle: 'Deep Reflections',
        reflectionIds: longReflections.map(r => r.id),
        reason: `${longReflections.length} longer, more detailed reflections`,
        confidence: 0.6,
      });
    }

    // Return top 3 suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Get suggestion message (constitutional language)
   */
  getSuggestionMessage(): string {
    return 'These reflections could become a thread.';
  }

  /**
   * Get dismissal message (constitutional language)
   */
  getDismissalMessage(): string {
    return 'This suggestion appears once.';
  }
}

// Singleton instance
export const threadDiscoveryService = new ThreadDiscoveryService();
