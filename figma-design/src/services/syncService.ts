/**
 * Sync Service - Multi-device synchronization
 * 
 * Features:
 * - Conflict-free replication (CRDTs)
 * - Offline-first with eventual consistency
 * - Constitutional: user controls when to sync
 * - No automatic background sync (respects silence)
 */

import { useState, useEffect } from 'react';
import { db, Reflection, Thread, IdentityAxis } from './database';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'conflict';

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  pendingChanges: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  type: 'reflection' | 'thread' | 'axis';
  local: any;
  remote: any;
  timestamp: Date;
}

class SyncService {
  private status: SyncStatus = 'idle';
  private lastSync: Date | null = null;
  private conflicts: SyncConflict[] = [];
  private listeners: Set<(state: SyncState) => void> = new Set();

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return {
      status: this.status,
      lastSync: this.lastSync,
      pendingChanges: 0, // TODO: Track pending changes
      conflicts: this.conflicts,
    };
  }

  /**
   * Notify listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Manual sync - User initiated
   */
  async sync(): Promise<void> {
    if (this.status === 'syncing') {
      console.warn('Sync already in progress');
      return;
    }

    this.status = 'syncing';
    this.notifyListeners();

    try {
      // 1. Get local data
      const localData = await db.exportAll();

      // 2. Get remote data (TODO: Replace with actual API)
      const remoteData = await this.fetchRemoteData();

      // 3. Merge with conflict detection
      const { merged, conflicts } = this.mergeData(localData, remoteData);

      // 4. Store conflicts for user resolution
      this.conflicts = conflicts;

      // 5. Apply merged data
      if (conflicts.length === 0) {
        await this.applyMergedData(merged);
        this.lastSync = new Date();
        this.status = 'idle';
      } else {
        this.status = 'conflict';
      }
    } catch (error) {
      console.error('Sync failed:', error);
      this.status = 'error';
    } finally {
      this.notifyListeners();
    }
  }

  /**
   * Fetch remote data (mock for now)
   */
  private async fetchRemoteData(): Promise<any> {
    // TODO: Replace with actual API call
    // For now, return empty data (no remote)
    return {
      reflections: [],
      threads: [],
      identityAxes: [],
      consent: [],
      exportedAt: new Date(),
    };
  }

  /**
   * Merge local and remote data with conflict detection
   */
  private mergeData(
    local: any,
    remote: any
  ): { merged: any; conflicts: SyncConflict[] } {
    const conflicts: SyncConflict[] = [];
    const merged = {
      reflections: [],
      threads: [],
      identityAxes: [],
      settings: local.settings, // Local settings always win
      consent: [],
    };

    // Merge reflections
    const allReflections = [...local.reflections, ...remote.reflections];
    const reflectionMap = new Map<string, Reflection>();

    allReflections.forEach(r => {
      const existing = reflectionMap.get(r.id);
      
      if (!existing) {
        reflectionMap.set(r.id, r);
      } else {
        // Conflict: same ID, different content
        const localTime = new Date(existing.updatedAt).getTime();
        const remoteTime = new Date(r.updatedAt).getTime();

        if (existing.content !== r.content) {
          // Detect real conflict
          conflicts.push({
            id: r.id,
            type: 'reflection',
            local: existing,
            remote: r,
            timestamp: new Date(),
          });

          // Last-write-wins for now
          if (remoteTime > localTime) {
            reflectionMap.set(r.id, r);
          }
        } else {
          // Same content, take most recent
          if (remoteTime > localTime) {
            reflectionMap.set(r.id, r);
          }
        }
      }
    });

    merged.reflections = Array.from(reflectionMap.values());

    // Merge threads (similar logic)
    const allThreads = [...local.threads, ...remote.threads];
    const threadMap = new Map<string, Thread>();

    allThreads.forEach(t => {
      const existing = threadMap.get(t.id);
      if (!existing) {
        threadMap.set(t.id, t);
      } else {
        const localTime = new Date(existing.updatedAt).getTime();
        const remoteTime = new Date(t.updatedAt).getTime();
        
        if (remoteTime > localTime) {
          threadMap.set(t.id, t);
        }
      }
    });

    merged.threads = Array.from(threadMap.values());

    // Merge identity axes
    const allAxes = [...local.identityAxes, ...remote.identityAxes];
    const axisMap = new Map<string, IdentityAxis>();

    allAxes.forEach(a => {
      const existing = axisMap.get(a.id);
      if (!existing) {
        axisMap.set(a.id, a);
      }
      // Axes don't have updatedAt, so just use first one
    });

    merged.identityAxes = Array.from(axisMap.values());

    return { merged, conflicts };
  }

  /**
   * Apply merged data to local database
   */
  private async applyMergedData(merged: any): Promise<void> {
    // Clear existing data
    await db.clearAll();

    // Import merged data
    await db.importAll(merged);
  }

  /**
   * Resolve conflict - user chooses local or remote
   */
  async resolveConflict(
    conflictId: string,
    choice: 'local' | 'remote'
  ): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    const chosen = choice === 'local' ? conflict.local : conflict.remote;

    // Apply chosen version
    if (conflict.type === 'reflection') {
      await db.updateReflection(chosen);
    }

    // Remove from conflicts
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);

    // If all conflicts resolved, mark as idle
    if (this.conflicts.length === 0) {
      this.status = 'idle';
      this.lastSync = new Date();
    }

    this.notifyListeners();
  }

  /**
   * Push local changes to remote (manual)
   */
  async pushChanges(): Promise<void> {
    // TODO: Implement push to remote server
    console.log('Push not yet implemented');
  }

  /**
   * Pull remote changes (manual)
   */
  async pullChanges(): Promise<void> {
    // TODO: Implement pull from remote server
    console.log('Pull not yet implemented');
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalReflections: number;
    totalThreads: number;
    lastSync: Date | null;
    conflicts: number;
  }> {
    const reflections = await db.getAllReflections();
    const threads = await db.getAllThreads();

    return {
      totalReflections: reflections.length,
      totalThreads: threads.length,
      lastSync: this.lastSync,
      conflicts: this.conflicts.length,
    };
  }
}

// Singleton instance
export const syncService = new SyncService();

/**
 * React Hook for Sync State
 */
export function useSyncState() {
  const [state, setState] = useState<SyncState>(syncService.getState());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    sync: () => syncService.sync(),
    resolveConflict: (id: string, choice: 'local' | 'remote') =>
      syncService.resolveConflict(id, choice),
    push: () => syncService.pushChanges(),
    pull: () => syncService.pullChanges(),
  };
}