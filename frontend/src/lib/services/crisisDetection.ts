/**
 * Crisis Detection Service
 * Local pattern detection for concerning content
 * Constitutional: Never shares data, purely local analysis
 */

// Crisis keywords (simplified - real version would use NLP)
const concernKeywords = [
  'depressed', 'hopeless', 'worthless', 'overwhelming',
  'can\'t cope', 'giving up', 'no point', 'tired of living'
];

const urgentKeywords = [
  'suicide', 'kill myself', 'end it all', 'not worth living',
  'better off dead', 'want to die', 'harm myself'
];

export interface CrisisDetectionResult {
  detected: boolean;
  severity: 'none' | 'concern' | 'urgent';
  patterns: string[];
}

class CrisisDetectionService {
  /**
   * Analyze text for crisis patterns
   * Pure client-side, no data sent anywhere
   */
  analyze(text: string): CrisisDetectionResult {
    if (!text || text.length < 20) {
      return { detected: false, severity: 'none', patterns: [] };
    }

    const lowerText = text.toLowerCase();
    const patterns: string[] = [];

    // Check urgent patterns
    for (const keyword of urgentKeywords) {
      if (lowerText.includes(keyword)) {
        patterns.push(keyword);
      }
    }

    if (patterns.length > 0) {
      return {
        detected: true,
        severity: 'urgent',
        patterns,
      };
    }

    // Check concern patterns
    for (const keyword of concernKeywords) {
      if (lowerText.includes(keyword)) {
        patterns.push(keyword);
      }
    }

    if (patterns.length >= 2) {
      return {
        detected: true,
        severity: 'concern',
        patterns,
      };
    }

    return { detected: false, severity: 'none', patterns: [] };
  }

  /**
   * Check if user has dismissed recently (constitutional: respect dismissal)
   */
  isDismissedRecently(): boolean {
    const dismissed = localStorage.getItem('crisis_banner_dismissed');
    if (!dismissed) return false;

    const dismissedTime = parseInt(dismissed, 10);
    const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
    
    // Respect dismissal for 24 hours
    return hoursSinceDismiss < 24;
  }

  /**
   * Record dismissal
   */
  recordDismissal(): void {
    localStorage.setItem('crisis_banner_dismissed', Date.now().toString());
  }
}

export const crisisDetectionService = new CrisisDetectionService();
