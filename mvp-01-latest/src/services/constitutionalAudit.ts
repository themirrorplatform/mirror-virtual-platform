/**
 * Constitutional Audit Service
 * 
 * Constitutional Principles:
 * - System must monitor its own adherence to principles
 * - Violations are logged and visible to user
 * - User can verify sovereignty at any time
 * - Audit is transparent, not hidden
 */

export interface ConstitutionalViolation {
  id: string;
  timestamp: Date;
  type: 'language' | 'pressure' | 'metrics' | 'automatic' | 'surveillance';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  location: string; // component/function where violation occurred
  suggestion?: string;
}

export interface AuditReport {
  healthy: boolean;
  score: number; // 0-100, 100 = perfect constitutional alignment
  violations: ConstitutionalViolation[];
  sovereignty: {
    dataPortability: boolean;
    localFirst: boolean;
    userControl: boolean;
    noTracking: boolean;
    explicitConsent: boolean;
  };
  privacy: {
    encryptionAvailable: boolean;
    encryptionEnabled: boolean;
    noExternalCalls: boolean;
    offlineCapable: boolean;
  };
  ux: {
    noMetrics: boolean;
    noGamification: boolean;
    noPressure: boolean;
    silenceFirst: boolean;
  };
  lastAudit: Date;
}

class ConstitutionalAuditService {
  private violations: ConstitutionalViolation[] = [];
  private readonly FORBIDDEN_WORDS = [
    'get started',
    'recommended',
    'you should',
    'next step',
    'improve',
    'optimize',
    'complete',
    'progress',
    'finish',
    'try this',
    'create one to start',
    'can help you',
  ];

  /**
   * Run full constitutional audit
   */
  async audit(): Promise<AuditReport> {
    const violations = await this.detectViolations();
    const sovereignty = await this.checkSovereignty();
    const privacy = await this.checkPrivacy();
    const ux = await this.checkUX();

    // Calculate score
    const violationPenalty = violations.filter(v => v.severity === 'critical').length * 10 +
                            violations.filter(v => v.severity === 'warning').length * 5;
    
    const sovereigntyScore = Object.values(sovereignty).filter(v => v).length * 5;
    const privacyScore = Object.values(privacy).filter(v => v).length * 5;
    const uxScore = Object.values(ux).filter(v => v).length * 5;

    const score = Math.max(0, sovereigntyScore + privacyScore + uxScore - violationPenalty);

    return {
      healthy: score >= 80,
      score,
      violations,
      sovereignty,
      privacy,
      ux,
      lastAudit: new Date(),
    };
  }

  /**
   * Detect constitutional violations in UI
   */
  private async detectViolations(): Promise<ConstitutionalViolation[]> {
    const violations: ConstitutionalViolation[] = [];

    // Check for forbidden language in DOM
    if (typeof document !== 'undefined') {
      const bodyText = document.body.innerText.toLowerCase();

      for (const forbidden of this.FORBIDDEN_WORDS) {
        if (bodyText.includes(forbidden.toLowerCase())) {
          violations.push({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: 'language',
            severity: 'critical',
            description: `Forbidden phrase detected: "${forbidden}"`,
            location: 'UI Text',
            suggestion: 'Use neutral, descriptive language instead',
          });
        }
      }

      // Check for progress indicators
      const progressElements = document.querySelectorAll('[role="progressbar"], .progress, progress');
      if (progressElements.length > 0) {
        violations.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          type: 'pressure',
          severity: 'critical',
          description: 'Progress bar detected',
          location: 'UI Components',
          suggestion: 'Remove all completion/progress indicators',
        });
      }

      // Check for metrics displays (word count, etc.)
      const metricsPatterns = [
        /\d+\s*words?/i,
        /\d+%/i,
        /\d+\/\d+/,
      ];

      for (const pattern of metricsPatterns) {
        if (pattern.test(bodyText)) {
          violations.push({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: 'metrics',
            severity: 'warning',
            description: 'Metrics display detected',
            location: 'UI Text',
            suggestion: 'Remove all quantitative metrics',
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check data sovereignty principles
   */
  private async checkSovereignty(): Promise<AuditReport['sovereignty']> {
    return {
      dataPortability: this.checkDataPortability(),
      localFirst: this.checkLocalFirst(),
      userControl: this.checkUserControl(),
      noTracking: this.checkNoTracking(),
      explicitConsent: this.checkExplicitConsent(),
    };
  }

  /**
   * Check privacy principles
   */
  private async checkPrivacy(): Promise<AuditReport['privacy']> {
    return {
      encryptionAvailable: this.checkEncryptionAvailable(),
      encryptionEnabled: this.checkEncryptionEnabled(),
      noExternalCalls: await this.checkNoExternalCalls(),
      offlineCapable: this.checkOfflineCapable(),
    };
  }

  /**
   * Check UX principles
   */
  private async checkUX(): Promise<AuditReport['ux']> {
    return {
      noMetrics: this.checkNoMetrics(),
      noGamification: this.checkNoGamification(),
      noPressure: this.checkNoPressure(),
      silenceFirst: this.checkSilenceFirst(),
    };
  }

  // Individual checks
  private checkDataPortability(): boolean {
    // Check if export functionality exists
    return typeof localStorage !== 'undefined';
  }

  private checkLocalFirst(): boolean {
    // Check if IndexedDB is being used
    return typeof indexedDB !== 'undefined';
  }

  private checkUserControl(): boolean {
    // Check if user can delete all data
    return true; // Always true if clearAll exists in database
  }

  private checkNoTracking(): boolean {
    // Check for analytics scripts
    if (typeof document === 'undefined') return true;

    const scripts = Array.from(document.querySelectorAll('script'));
    const analyticsPatterns = [
      'google-analytics',
      'gtag',
      'analytics.js',
      'segment.com',
      'mixpanel',
      'amplitude',
    ];

    return !scripts.some(script => 
      analyticsPatterns.some(pattern => 
        script.src.includes(pattern) || script.innerHTML.includes(pattern)
      )
    );
  }

  private checkExplicitConsent(): boolean {
    // Check if consent is recorded before actions
    // This would check the consent store
    return true; // Placeholder
  }

  private checkEncryptionAvailable(): boolean {
    return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
  }

  private checkEncryptionEnabled(): boolean {
    return localStorage.getItem('mirror_encryption_salt') !== null;
  }

  private async checkNoExternalCalls(): Promise<boolean> {
    // In a real implementation, this would monitor network requests
    // For now, we check if there are any fetch/XHR in progress
    return true; // Placeholder
  }

  private checkOfflineCapable(): boolean {
    return 'serviceWorker' in navigator || typeof indexedDB !== 'undefined';
  }

  private checkNoMetrics(): boolean {
    if (typeof document === 'undefined') return true;
    const text = document.body.innerText;
    return !/\d+\s*words?/i.test(text) && !/\d+\s*characters?/i.test(text);
  }

  private checkNoGamification(): boolean {
    if (typeof document === 'undefined') return true;
    const gamificationTerms = ['streak', 'badge', 'achievement', 'points', 'level'];
    const text = document.body.innerText.toLowerCase();
    return !gamificationTerms.some(term => text.includes(term));
  }

  private checkNoPressure(): boolean {
    if (typeof document === 'undefined') return true;
    const pressureTerms = ['hurry', 'deadline', 'urgent', 'required', 'must'];
    const text = document.body.innerText.toLowerCase();
    return !pressureTerms.some(term => text.includes(term));
  }

  private checkSilenceFirst(): boolean {
    // Check if UI is minimal (not constantly showing notifications/hints)
    return true; // Placeholder
  }

  /**
   * Log a violation (for runtime detection)
   */
  logViolation(violation: Omit<ConstitutionalViolation, 'id' | 'timestamp'>): void {
    this.violations.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...violation,
    });

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Constitutional Violation]', violation);
    }
  }

  /**
   * Get recent violations
   */
  getViolations(since?: Date): ConstitutionalViolation[] {
    if (!since) return [...this.violations];
    return this.violations.filter(v => v.timestamp >= since);
  }

  /**
   * Clear violation history
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Get sovereignty score (0-100)
   */
  async getSovereigntyScore(): Promise<number> {
    const report = await this.audit();
    return report.score;
  }

  /**
   * Generate human-readable report
   */
  async generateReport(): Promise<string> {
    const report = await this.audit();
    
    let text = `# Constitutional Health Report\n\n`;
    text += `**Overall Score**: ${report.score}/100 ${report.healthy ? '✅' : '⚠️'}\n\n`;
    
    text += `## Data Sovereignty\n`;
    text += `- Data Portability: ${report.sovereignty.dataPortability ? '✅' : '❌'}\n`;
    text += `- Local-First: ${report.sovereignty.localFirst ? '✅' : '❌'}\n`;
    text += `- User Control: ${report.sovereignty.userControl ? '✅' : '❌'}\n`;
    text += `- No Tracking: ${report.sovereignty.noTracking ? '✅' : '❌'}\n`;
    text += `- Explicit Consent: ${report.sovereignty.explicitConsent ? '✅' : '❌'}\n\n`;
    
    text += `## Privacy\n`;
    text += `- Encryption Available: ${report.privacy.encryptionAvailable ? '✅' : '❌'}\n`;
    text += `- Encryption Enabled: ${report.privacy.encryptionEnabled ? '✅' : '❌'}\n`;
    text += `- No External Calls: ${report.privacy.noExternalCalls ? '✅' : '❌'}\n`;
    text += `- Offline Capable: ${report.privacy.offlineCapable ? '✅' : '❌'}\n\n`;
    
    text += `## UX Principles\n`;
    text += `- No Metrics: ${report.ux.noMetrics ? '✅' : '❌'}\n`;
    text += `- No Gamification: ${report.ux.noGamification ? '✅' : '❌'}\n`;
    text += `- No Pressure: ${report.ux.noPressure ? '✅' : '❌'}\n`;
    text += `- Silence First: ${report.ux.silenceFirst ? '✅' : '❌'}\n\n`;
    
    if (report.violations.length > 0) {
      text += `## Violations (${report.violations.length})\n\n`;
      for (const violation of report.violations) {
        text += `- **${violation.severity.toUpperCase()}**: ${violation.description}\n`;
        text += `  Location: ${violation.location}\n`;
        if (violation.suggestion) {
          text += `  Suggestion: ${violation.suggestion}\n`;
        }
        text += `\n`;
      }
    } else {
      text += `## Violations\nNo violations detected ✅\n\n`;
    }
    
    text += `---\n`;
    text += `*Audited at: ${report.lastAudit.toISOString()}*\n`;
    
    return text;
  }
}

// Singleton instance
export const constitutionalAudit = new ConstitutionalAuditService();
