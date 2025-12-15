/**
 * State Manager - Centralized state management
 * 
 * Features:
 * - Reactive state updates
 * - Persistence to IndexedDB
 * - Event-driven architecture
 * - Type-safe operations
 */

import { db, Reflection, Thread, IdentityAxis, UserSettings } from './database';
import { mirrorOS } from './mirrorOS';

type StateChangeListener = (state: AppState) => void;

export interface AppState {
  // Core data
  reflections: Reflection[];
  threads: Thread[];
  identityAxes: IdentityAxis[];
  settings: UserSettings | null;

  // UI state
  currentLayer: 'sovereign' | 'commons' | 'builder';
  currentThread: string | null;
  currentIdentityAxis: string | null;
  
  // Feature flags
  crisisMode: boolean;
  offlineMode: boolean;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
}

class StateManager {
  private state: AppState = {
    reflections: [],
    threads: [],
    identityAxes: [],
    settings: null,
    currentLayer: 'sovereign',
    currentThread: null,
    currentIdentityAxis: null,
    crisisMode: false,
    offlineMode: false,
    isLoading: true,
    isSyncing: false,
  };

  private listeners: Set<StateChangeListener> = new Set();
  private initialized: boolean = false;

  /**
   * Initialize state from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure database is initialized first
      await db.init();

      const [reflections, threads, identityAxes, settings] = await Promise.all([
        db.getAllReflections(),
        db.getAllThreads(),
        db.getAllIdentityAxes(),
        db.getSettings(),
      ]);

      this.state = {
        ...this.state,
        reflections,
        threads,
        identityAxes,
        settings,
        isLoading: false,
      };

      this.initialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to initialize state:', error);
      this.state.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): Readonly<AppState> {
    return { ...this.state };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach(listener => listener(stateCopy));
  }

  /**
   * Update state and persist
   */
  private async updateState(updates: Partial<AppState>): Promise<void> {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  // REFLECTIONS

  async createReflection(
    content: string,
    options?: {
      threadId?: string;
      identityAxis?: string;
      modality?: 'text' | 'voice' | 'video' | 'document';
      tags?: string[];
    }
  ): Promise<Reflection> {
    const reflection: Reflection = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      layer: this.state.currentLayer,
      modality: options?.modality || 'text',
      threadId: options?.threadId || this.state.currentThread || undefined,
      tags: options?.tags,
      identityAxis: options?.identityAxis || this.state.currentIdentityAxis || undefined,
      isPublic: this.state.currentLayer === 'commons',
      metadata: {},
    };

    // Save to database
    await db.addReflection(reflection);

    // Update state - ensure reflections is an array
    const currentReflections = Array.isArray(this.state.reflections) ? this.state.reflections : [];
    await this.updateState({
      reflections: [...currentReflections, reflection],
    });

    // Check for crisis (async, non-blocking)
    this.checkCrisis(reflection);

    return reflection;
  }

  async updateReflection(id: string, updates: Partial<Reflection>): Promise<void> {
    const reflections = Array.isArray(this.state.reflections) ? this.state.reflections : [];
    const reflection = reflections.find(r => r.id === id);
    if (!reflection) throw new Error('Reflection not found');

    const updated = {
      ...reflection,
      ...updates,
      updatedAt: new Date(),
    };

    await db.updateReflection(updated);

    await this.updateState({
      reflections: reflections.map(r => r.id === id ? updated : r),
    });
  }

  async deleteReflection(id: string): Promise<void> {
    await db.deleteReflection(id);

    const reflections = Array.isArray(this.state.reflections) ? this.state.reflections : [];
    await this.updateState({
      reflections: reflections.filter(r => r.id !== id),
    });
  }

  async getReflectionsByThread(threadId: string): Promise<Reflection[]> {
    const reflections = Array.isArray(this.state.reflections) ? this.state.reflections : [];
    return reflections.filter(r => r.threadId === threadId);
  }

  // THREADS

  async createThread(title: string, reflectionIds: string[] = []): Promise<Thread> {
    const thread: Thread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      reflectionIds,
    };

    await db.addThread(thread);

    await this.updateState({
      threads: [...this.state.threads, thread],
    });

    return thread;
  }

  async updateThread(id: string, updates: Partial<Thread>): Promise<void> {
    const thread = this.state.threads.find(t => t.id === id);
    if (!thread) throw new Error('Thread not found');

    const updated = {
      ...thread,
      ...updates,
      updatedAt: new Date(),
    };

    await db.updateThread(updated);

    await this.updateState({
      threads: this.state.threads.map(t => t.id === id ? updated : t),
    });
  }

  async deleteThread(id: string): Promise<void> {
    await db.deleteThread(id);

    await this.updateState({
      threads: this.state.threads.filter(t => t.id !== id),
    });
  }

  async addReflectionToThread(threadId: string, reflectionId: string): Promise<void> {
    const thread = this.state.threads.find(t => t.id === threadId);
    if (!thread) throw new Error('Thread not found');

    const updated = {
      ...thread,
      reflectionIds: [...thread.reflectionIds, reflectionId],
      updatedAt: new Date(),
    };

    await db.updateThread(updated);

    // Also update the reflection
    await this.updateReflection(reflectionId, { threadId });

    await this.updateState({
      threads: this.state.threads.map(t => t.id === threadId ? updated : t),
    });
  }

  // IDENTITY AXES

  async createIdentityAxis(name: string, color: string, description?: string): Promise<IdentityAxis> {
    const axis: IdentityAxis = {
      id: `axis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      description,
      createdAt: new Date(),
    };

    await db.addIdentityAxis(axis);

    await this.updateState({
      identityAxes: [...this.state.identityAxes, axis],
    });

    return axis;
  }

  async updateIdentityAxis(id: string, updates: Partial<IdentityAxis>): Promise<void> {
    const axis = this.state.identityAxes.find(a => a.id === id);
    if (!axis) throw new Error('Identity axis not found');

    const updated = { ...axis, ...updates };

    await db.updateIdentityAxis(updated);

    await this.updateState({
      identityAxes: this.state.identityAxes.map(a => a.id === id ? updated : a),
    });
  }

  async deleteIdentityAxis(id: string): Promise<void> {
    await db.deleteIdentityAxis(id);

    await this.updateState({
      identityAxes: this.state.identityAxes.filter(a => a.id !== id),
    });
  }

  // SETTINGS

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const current = this.state.settings || this.getDefaultSettings();
    const updated = { ...current, ...settings };

    await db.saveSettings(updated);

    await this.updateState({
      settings: updated,
    });
  }

  private getDefaultSettings(): UserSettings {
    return {
      theme: 'system',
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
      },
      preferences: {
        defaultLayer: 'sovereign',
        defaultModality: 'text',
        particlesEnabled: true,
      },
    };
  }

  // UI STATE

  async setCurrentLayer(layer: 'sovereign' | 'commons' | 'builder'): Promise<void> {
    await this.updateState({ currentLayer: layer });
  }

  async setCurrentThread(threadId: string | null): Promise<void> {
    await this.updateState({ currentThread: threadId });
  }

  async setCurrentIdentityAxis(axisId: string | null): Promise<void> {
    await this.updateState({ currentIdentityAxis: axisId });
  }

  async setCrisisMode(enabled: boolean): Promise<void> {
    await this.updateState({ crisisMode: enabled });
  }

  // CRISIS DETECTION

  private async checkCrisis(reflection: Reflection): Promise<void> {
    try {
      const signal = await mirrorOS.detectCrisis(reflection);
      
      if (signal.detected && signal.confidence > 0.5) {
        await this.setCrisisMode(true);
        
        // TODO: Trigger crisis modal/instrument
        console.warn('Crisis signal detected:', signal);
      }
    } catch (error) {
      console.error('Crisis detection failed:', error);
    }
  }

  // EXPORT/IMPORT

  async exportAllData(): Promise<Blob> {
    const data = await db.exportAll();
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  async importData(data: any): Promise<void> {
    await db.importAll(data);
    await this.initialize(); // Reload state
  }

  async clearAllData(): Promise<void> {
    if (!confirm('Are you sure? This will delete ALL your reflections and data. This cannot be undone.')) {
      return;
    }

    await db.clearAll();
    await this.initialize();
  }
}

// Singleton instance
export const stateManager = new StateManager();

// Initialize on module load
if (typeof window !== 'undefined') {
  stateManager.initialize().catch(console.error);
}

export type { StateChangeListener };