/**
 * Auto-Recovery Service - Zero Data Loss
 * 
 * Constitutional Principles:
 * - Never lose a single character
 * - Immediate localStorage backup during typing
 * - Supabase persistence on pause
 * - Recovery offered on crash/reload, never automatic
 */

export interface RecoverySnapshot {
  id: string;
  content: string;
  timestamp: number;
  metadata?: {
    threadId?: string;
    identityAxis?: string;
    modality?: 'text' | 'voice' | 'video' | 'document';
  };
}

class AutoRecoveryService {
  private readonly STORAGE_KEY = 'mirror_recovery_snapshot';
  private readonly MAX_SNAPSHOTS = 10;
  private debounceTimer: number | null = null;

  /**
   * Save immediate recovery snapshot to localStorage
   * Called on every keystroke (debounced to 100ms)
   */
  saveSnapshot(content: string, metadata?: RecoverySnapshot['metadata']): void {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      const snapshot: RecoverySnapshot = {
        id: crypto.randomUUID(),
        content,
        timestamp: Date.now(),
        metadata,
      };

      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.error('Failed to save recovery snapshot:', error);
      }
    }, 100);
  }

  /**
   * Get most recent recovery snapshot
   * Returns null if no recovery available
   */
  async getSnapshot(): Promise<RecoverySnapshot | null> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      const snapshot: RecoverySnapshot = JSON.parse(stored);
      return snapshot;
    } catch (error) {
      console.error('Failed to retrieve recovery snapshot:', error);
      return null;
    }
  }

  /**
   * Clear recovery snapshot
   * Called after successful save to database
   */
  clearSnapshot(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if recovery is available
   */
  hasRecovery(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Get recovery age (in seconds)
   */
  getRecoveryAge(): number | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      const snapshot: RecoverySnapshot = JSON.parse(stored);
      return (Date.now() - snapshot.timestamp) / 1000;
    } catch {
      return null;
    }
  }

  /**
   * Save snapshot history to allow multiple recovery points
   */
  saveToHistory(content: string, metadata?: RecoverySnapshot['metadata']): void {
    const historyKey = `${this.STORAGE_KEY}_history`;
    const stored = localStorage.getItem(historyKey);
    let history: RecoverySnapshot[] = [];

    if (stored) {
      try {
        history = JSON.parse(stored);
      } catch {
        history = [];
      }
    }

    const snapshot: RecoverySnapshot = {
      id: crypto.randomUUID(),
      content,
      timestamp: Date.now(),
      metadata,
    };

    history.unshift(snapshot);

    // Keep only MAX_SNAPSHOTS
    if (history.length > this.MAX_SNAPSHOTS) {
      history = history.slice(0, this.MAX_SNAPSHOTS);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  /**
   * Get recovery history
   */
  getHistory(): RecoverySnapshot[] {
    const historyKey = `${this.STORAGE_KEY}_history`;
    const stored = localStorage.getItem(historyKey);

    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Clear all recovery data
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(`${this.STORAGE_KEY}_history`);
  }
}

export const autoRecoveryService = new AutoRecoveryService();
