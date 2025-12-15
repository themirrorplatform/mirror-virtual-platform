/**
 * Auto-Recovery Service - Zero Data Loss
 * 
 * Constitutional Principles:
 * - Never lose a single character
 * - Immediate localStorage backup during typing
 * - IndexedDB persistence on pause
 * - Recovery offered on crash/reload, never automatic
 */

import { encryptionService } from './encryption';

export interface RecoverySnapshot {
  id: string;
  content: string;
  encrypted: boolean;
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

    this.debounceTimer = window.setTimeout(async () => {
      const snapshot: RecoverySnapshot = {
        id: crypto.randomUUID(),
        content,
        encrypted: encryptionService.isEnabled(),
        timestamp: Date.now(),
        metadata,
      };

      try {
        // Encrypt if enabled
        if (encryptionService.isEnabled()) {
          const encrypted = await encryptionService.encrypt(content);
          localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify({
              ...snapshot,
              content: encrypted,
            })
          );
        } else {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshot));
        }
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

      // Decrypt if needed
      if (snapshot.encrypted && encryptionService.isEnabled()) {
        const decrypted = await encryptionService.decrypt(snapshot.content as any);
        return {
          ...snapshot,
          content: decrypted,
        };
      }

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
   * Save multiple snapshots for history
   * (Constitutional: user can review what was lost)
   */
  async saveToHistory(snapshot: RecoverySnapshot): Promise<void> {
    const historyKey = 'mirror_recovery_history';
    const stored = localStorage.getItem(historyKey);
    
    let history: RecoverySnapshot[] = [];
    if (stored) {
      try {
        history = JSON.parse(stored);
      } catch {
        history = [];
      }
    }

    history.unshift(snapshot);
    history = history.slice(0, this.MAX_SNAPSHOTS);

    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  /**
   * Get recovery history
   */
  async getHistory(): Promise<RecoverySnapshot[]> {
    const stored = localStorage.getItem('mirror_recovery_history');
    if (!stored) return [];

    try {
      const history: RecoverySnapshot[] = JSON.parse(stored);
      
      // Decrypt each if needed
      if (encryptionService.isEnabled()) {
        return Promise.all(
          history.map(async (snapshot) => {
            if (snapshot.encrypted) {
              const decrypted = await encryptionService.decrypt(snapshot.content as any);
              return { ...snapshot, content: decrypted };
            }
            return snapshot;
          })
        );
      }

      return history;
    } catch {
      return [];
    }
  }

  /**
   * Clear all recovery data
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('mirror_recovery_history');
  }
}

// Singleton instance
export const autoRecoveryService = new AutoRecoveryService();
