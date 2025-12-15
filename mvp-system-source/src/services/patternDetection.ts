/**
 * Pattern Detection Service
 * 
 * Constitutional Principles:
 * - NEVER automatic - always explicitly summoned by user
 * - No automatic analysis without consent
 * - User controls when patterns are detected
 * - Results are offered, not imposed
 */

import { Reflection } from './database';

export interface Pattern {
  id: string;
  type: 'recurring_theme' | 'emotional_shift' | 'temporal' | 'contradiction' | 'evolution';
  description: string;
  reflections: string[]; // Reflection IDs
  confidence: number; // 0-1
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
}

export interface PatternDetectionOptions {
  timeRange?: { start: Date; end: Date };
  minOccurrences?: number;
  types?: Pattern['type'][];
  threadId?: string;
  identityAxis?: string;
}

class PatternDetectionService {
  private enabled: boolean = false;

  /**
   * Enable pattern detection (user must opt-in)
   */
  enable(): void {
    this.enabled = true;
    localStorage.setItem('mirror_pattern_detection_enabled', 'true');
  }

  /**
   * Disable pattern detection
   */
  disable(): void {
    this.enabled = false;
    localStorage.removeItem('mirror_pattern_detection_enabled');
  }

  /**
   * Check if pattern detection is enabled
   */
  isEnabled(): boolean {
    return localStorage.getItem('mirror_pattern_detection_enabled') === 'true';
  }

  /**
   * Detect patterns (ONLY when explicitly called)
   * Constitutional: Never runs automatically
   */
  async detectPatterns(
    reflections: Reflection[],
    options: PatternDetectionOptions = {}
  ): Promise<Pattern[]> {
    // Constitutional check: user must explicitly enable
    if (!this.isEnabled()) {
      throw new Error('Pattern detection not enabled. User must opt-in first.');
    }

    const patterns: Pattern[] = [];

    // Filter reflections by options
    let filtered = reflections;

    if (options.timeRange) {
      filtered = filtered.filter(
        r => r.createdAt >= options.timeRange!.start && 
             r.createdAt <= options.timeRange!.end
      );
    }

    if (options.threadId) {
      filtered = filtered.filter(r => r.threadId === options.threadId);
    }

    if (options.identityAxis) {
      filtered = filtered.filter(r => r.identityAxis === options.identityAxis);
    }

    // Detect recurring themes
    if (!options.types || options.types.includes('recurring_theme')) {
      patterns.push(...this.detectRecurringThemes(filtered, options.minOccurrences));
    }

    // Detect temporal patterns
    if (!options.types || options.types.includes('temporal')) {
      patterns.push(...this.detectTemporalPatterns(filtered));
    }

    // Detect contradictions
    if (!options.types || options.types.includes('contradiction')) {
      patterns.push(...this.detectContradictions(filtered));
    }

    // Detect evolution
    if (!options.types || options.types.includes('evolution')) {
      patterns.push(...this.detectEvolution(filtered));
    }

    return patterns;
  }

  /**
   * Detect recurring themes
   */
  private detectRecurringThemes(
    reflections: Reflection[],
    minOccurrences: number = 3
  ): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Simple keyword-based detection (mock implementation)
    // In real implementation, this would use NLP/embeddings
    const keywordGroups: Map<string, string[]> = new Map();

    for (const reflection of reflections) {
      const words = reflection.content.toLowerCase().split(/\s+/);
      const meaningfulWords = words.filter(w => w.length > 4);

      for (const word of meaningfulWords) {
        if (!keywordGroups.has(word)) {
          keywordGroups.set(word, []);
        }
        keywordGroups.get(word)!.push(reflection.id);
      }
    }

    // Find recurring keywords
    for (const [word, reflectionIds] of keywordGroups.entries()) {
      if (reflectionIds.length >= minOccurrences) {
        const uniqueIds = [...new Set(reflectionIds)];
        if (uniqueIds.length >= minOccurrences) {
          const relatedReflections = reflections.filter(r => uniqueIds.includes(r.id));
          
          patterns.push({
            id: crypto.randomUUID(),
            type: 'recurring_theme',
            description: `Recurring mention of "${word}"`,
            reflections: uniqueIds,
            confidence: Math.min(uniqueIds.length / 10, 1),
            firstSeen: relatedReflections[0].createdAt,
            lastSeen: relatedReflections[relatedReflections.length - 1].createdAt,
            occurrences: uniqueIds.length,
          });
        }
      }
    }

    return patterns.slice(0, 10); // Limit to top 10
  }

  /**
   * Detect temporal patterns (time-based)
   */
  private detectTemporalPatterns(reflections: Reflection[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Group by hour of day
    const hourGroups = new Map<number, string[]>();
    
    for (const reflection of reflections) {
      const hour = reflection.createdAt.getHours();
      if (!hourGroups.has(hour)) {
        hourGroups.set(hour, []);
      }
      hourGroups.get(hour)!.push(reflection.id);
    }

    // Find hours with significant activity
    for (const [hour, ids] of hourGroups.entries()) {
      if (ids.length >= 5) {
        const relatedReflections = reflections.filter(r => ids.includes(r.id));
        
        patterns.push({
          id: crypto.randomUUID(),
          type: 'temporal',
          description: `Tends to reflect around ${hour}:00`,
          reflections: ids,
          confidence: Math.min(ids.length / 20, 1),
          firstSeen: relatedReflections[0].createdAt,
          lastSeen: relatedReflections[relatedReflections.length - 1].createdAt,
          occurrences: ids.length,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect contradictions
   */
  private detectContradictions(reflections: Reflection[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Simple contradiction detection (mock)
    // In real implementation, would use semantic analysis
    const contradictionPairs = [
      { a: 'always', b: 'never' },
      { a: 'want', b: "don't want" },
      { a: 'should', b: "shouldn't" },
    ];

    for (const pair of contradictionPairs) {
      const hasA = reflections.filter(r => r.content.toLowerCase().includes(pair.a));
      const hasB = reflections.filter(r => r.content.toLowerCase().includes(pair.b));

      if (hasA.length > 0 && hasB.length > 0) {
        patterns.push({
          id: crypto.randomUUID(),
          type: 'contradiction',
          description: `Tension between "${pair.a}" and "${pair.b}"`,
          reflections: [...hasA.map(r => r.id), ...hasB.map(r => r.id)],
          confidence: 0.6,
          firstSeen: hasA[0].createdAt,
          lastSeen: hasB[hasB.length - 1].createdAt,
          occurrences: hasA.length + hasB.length,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect evolution over time
   */
  private detectEvolution(reflections: Reflection[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Sort by date
    const sorted = [...reflections].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    if (sorted.length < 5) return patterns;

    // Detect length evolution
    const avgLengthFirst = sorted.slice(0, 5).reduce((sum, r) => sum + r.content.length, 0) / 5;
    const avgLengthLast = sorted.slice(-5).reduce((sum, r) => sum + r.content.length, 0) / 5;

    if (Math.abs(avgLengthLast - avgLengthFirst) > 100) {
      const direction = avgLengthLast > avgLengthFirst ? 'longer' : 'shorter';
      
      patterns.push({
        id: crypto.randomUUID(),
        type: 'evolution',
        description: `Reflections becoming ${direction} over time`,
        reflections: sorted.map(r => r.id),
        confidence: Math.min(Math.abs(avgLengthLast - avgLengthFirst) / 500, 1),
        firstSeen: sorted[0].createdAt,
        lastSeen: sorted[sorted.length - 1].createdAt,
        occurrences: sorted.length,
      });
    }

    return patterns;
  }

  /**
   * Get pattern summary (for display)
   */
  async summarizePatterns(
    patterns: Pattern[],
    reflections: Reflection[]
  ): Promise<string> {
    if (patterns.length === 0) {
      return '...';
    }

    const summary = patterns
      .slice(0, 5)
      .map(p => `• ${p.description} (${p.occurrences} times)`)
      .join('\n');

    return summary;
  }
}

// Singleton instance
export const patternDetectionService = new PatternDetectionService();
