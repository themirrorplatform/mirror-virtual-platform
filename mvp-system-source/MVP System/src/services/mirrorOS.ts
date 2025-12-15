/**
 * MirrorOS - Core AI backend integration
 * 
 * Features:
 * - Local-first AI processing
 * - Constitutional constraints enforcement
 * - Mirrorback generation
 * - Pattern detection
 * - Crisis detection
 * - No external API dependencies (mock for now)
 */

import { Reflection, Thread } from './database';

// MirrorOS Response Types
export interface MirrorbackResponse {
  id: string;
  reflectionId: string;
  content: string;
  type: 'observation' | 'question' | 'pattern' | 'tension';
  timestamp: Date;
  constitutional: {
    respectsBoundaries: boolean;
    avoidsDirectives: boolean;
    maintainsSilence: boolean;
  };
}

export interface PatternDetection {
  id: string;
  pattern: string;
  reflections: string[];
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface CrisisSignal {
  detected: boolean;
  confidence: number;
  indicators: string[];
  recommendedActions: string[];
}

export interface ThreadSuggestion {
  suggestedTitle: string;
  relatedReflections: string[];
  rationale: string;
}

// Constitutional AI Wrapper
class MirrorOSService {
  private readonly apiEndpoint = '/api/mirror'; // Future: actual backend
  private readonly localMode = true; // Currently local-only

  /**
   * Generate Mirrorback - Constitutional reflection
   */
  async generateMirrorback(
    reflection: Reflection,
    context?: {
      recentReflections?: Reflection[];
      currentThread?: Thread;
    }
  ): Promise<MirrorbackResponse> {
    // TODO: Replace with actual MirrorCore API call
    // For now, use constitutional mock responses
    
    return this.mockMirrorback(reflection, context);
  }

  /**
   * Detect patterns across reflections
   */
  async detectPatterns(reflections: Reflection[]): Promise<PatternDetection[]> {
    // TODO: Replace with actual pattern detection AI
    return this.mockPatternDetection(reflections);
  }

  /**
   * Crisis detection - Constitutional safety
   */
  async detectCrisis(reflection: Reflection): Promise<CrisisSignal> {
    // TODO: Replace with actual crisis detection
    return this.mockCrisisDetection(reflection);
  }

  /**
   * Thread suggestions - Find connections
   */
  async suggestThread(reflections: Reflection[]): Promise<ThreadSuggestion | null> {
    if (reflections.length < 2) return null;
    
    // TODO: Replace with actual AI threading
    return this.mockThreadSuggestion(reflections);
  }

  /**
   * Search reflections semantically
   */
  async searchReflections(
    query: string,
    reflections: Reflection[]
  ): Promise<Reflection[]> {
    // TODO: Replace with vector search
    return this.mockSearch(query, reflections);
  }

  // MOCK IMPLEMENTATIONS (to be replaced)

  private mockMirrorback(
    reflection: Reflection,
    context?: { recentReflections?: Reflection[]; currentThread?: Thread }
  ): MirrorbackResponse {
    const observations = [
      "This thought appears here.",
      "A tension exists between these words.",
      "The language shifts when this topic emerges.",
      "This pattern has appeared before.",
      "Something remains unspoken here.",
    ];

    const questions = [
      "What lives between these words?",
      "Where does this thought lead?",
      "What if this were inverted?",
      "When has this appeared before?",
    ];

    const responses = [
      ...observations.map(o => ({ type: 'observation' as const, content: o })),
      ...questions.map(q => ({ type: 'question' as const, content: q })),
    ];

    const selected = responses[Math.floor(Math.random() * responses.length)];

    return {
      id: `mb-${Date.now()}`,
      reflectionId: reflection.id,
      content: selected.content,
      type: selected.type,
      timestamp: new Date(),
      constitutional: {
        respectsBoundaries: true,
        avoidsDirectives: true,
        maintainsSilence: true,
      },
    };
  }

  private mockPatternDetection(reflections: Reflection[]): PatternDetection[] {
    // Simple keyword-based pattern detection
    const keywords: Record<string, string[]> = {};

    reflections.forEach(r => {
      const words = r.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length < 4) return; // Skip short words
        if (!keywords[word]) keywords[word] = [];
        keywords[word].push(r.id);
      });
    });

    const patterns: PatternDetection[] = [];
    Object.entries(keywords).forEach(([word, refIds]) => {
      if (refIds.length >= 3) {
        patterns.push({
          id: `pattern-${word}`,
          pattern: `The word "${word}" appears repeatedly`,
          reflections: refIds,
          confidence: Math.min(refIds.length / 10, 0.95),
          firstSeen: new Date(Math.min(...refIds.map(id => {
            const r = reflections.find(ref => ref.id === id);
            return r ? r.createdAt.getTime() : Date.now();
          }))),
          lastSeen: new Date(),
        });
      }
    });

    return patterns.slice(0, 5); // Top 5 patterns
  }

  private mockCrisisDetection(reflection: Reflection): CrisisSignal {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'no point',
      'hopeless', 'can\'t go on', 'want to die'
    ];

    const content = reflection.content.toLowerCase();
    const indicators: string[] = [];
    
    crisisKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        indicators.push(`Language pattern: "${keyword}"`);
      }
    });

    const detected = indicators.length > 0;
    const confidence = Math.min(indicators.length * 0.3, 0.95);

    return {
      detected,
      confidence,
      indicators,
      recommendedActions: detected
        ? [
            'Access crisis resources immediately',
            'Consider reaching out to a trusted person',
            'Professional support is available',
          ]
        : [],
    };
  }

  private mockThreadSuggestion(reflections: Reflection[]): ThreadSuggestion {
    // Find common themes
    const allWords = reflections
      .flatMap(r => r.content.toLowerCase().split(/\s+/))
      .filter(w => w.length > 4);

    const wordCounts: Record<string, number> = {};
    allWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const topWord = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      suggestedTitle: topWord ? `Thoughts on ${topWord[0]}` : 'Recent Reflections',
      relatedReflections: reflections.map(r => r.id),
      rationale: topWord 
        ? `The word "${topWord[0]}" appears ${topWord[1]} times across these reflections`
        : 'These reflections share temporal proximity',
    };
  }

  private mockSearch(query: string, reflections: Reflection[]): Reflection[] {
    const queryLower = query.toLowerCase();
    return reflections.filter(r =>
      r.content.toLowerCase().includes(queryLower)
    );
  }
}

// Singleton export
export const mirrorOS = new MirrorOSService();

/**
 * Constitutional AI Constraints
 * 
 * All AI responses must:
 * 1. Never prescribe actions
 * 2. Never imply correctness
 * 3. Never optimize for engagement
 * 4. Respect epistemic boundaries
 * 5. Maintain silence as default
 */
export const CONSTITUTIONAL_CONSTRAINTS = {
  forbiddenPatterns: [
    'you should',
    'you need to',
    'try this',
    'I recommend',
    'the best way',
    'you must',
  ],
  allowedPatterns: [
    'this appears',
    'what if',
    'when',
    'where',
    'a tension exists',
    'this pattern',
  ],
  maxResponseLength: 200, // Characters
  silenceThreshold: 0.3, // Sometimes don't respond at all
};

/**
 * Validate AI response against constitution
 */
export function validateConstitutional(response: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  CONSTITUTIONAL_CONSTRAINTS.forbiddenPatterns.forEach(pattern => {
    if (response.toLowerCase().includes(pattern)) {
      violations.push(`Contains forbidden pattern: "${pattern}"`);
    }
  });

  if (response.length > CONSTITUTIONAL_CONSTRAINTS.maxResponseLength) {
    violations.push('Response too long (violates silence principle)');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
