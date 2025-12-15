/**
 * useAppState Hook - React integration with state manager
 * 
 * Provides reactive access to application state
 */

import { useState, useEffect } from 'react';
import { stateManager, AppState } from '../services/stateManager';
import { Reflection, Thread, IdentityAxis, UserSettings } from '../services/database';

export function useAppState() {
  const [state, setState] = useState<AppState>(stateManager.getState());

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe(setState);
    return unsubscribe;
  }, []);

  // Ensure reflections, threads, and identityAxes are always arrays
  const safeState = {
    ...state,
    reflections: Array.isArray(state.reflections) ? state.reflections : [],
    threads: Array.isArray(state.threads) ? state.threads : [],
    identityAxes: Array.isArray(state.identityAxes) ? state.identityAxes : [],
  };

  return {
    // State
    ...safeState,

    // Reflection actions
    createReflection: async (
      content: string,
      options?: {
        threadId?: string;
        identityAxis?: string;
        modality?: 'text' | 'voice' | 'video' | 'document';
        tags?: string[];
      }
    ) => stateManager.createReflection(content, options),

    updateReflection: (id: string, updates: Partial<Reflection>) =>
      stateManager.updateReflection(id, updates),

    deleteReflection: (id: string) => stateManager.deleteReflection(id),

    getReflectionsByThread: (threadId: string) =>
      stateManager.getReflectionsByThread(threadId),

    // Thread actions
    createThread: (title: string, reflectionIds?: string[]) =>
      stateManager.createThread(title, reflectionIds),

    updateThread: (id: string, updates: Partial<Thread>) =>
      stateManager.updateThread(id, updates),

    deleteThread: (id: string) => stateManager.deleteThread(id),

    addReflectionToThread: (threadId: string, reflectionId: string) =>
      stateManager.addReflectionToThread(threadId, reflectionId),

    // Identity axis actions
    createIdentityAxis: (name: string, color: string, description?: string) =>
      stateManager.createIdentityAxis(name, color, description),

    updateIdentityAxis: (id: string, updates: Partial<IdentityAxis>) =>
      stateManager.updateIdentityAxis(id, updates),

    deleteIdentityAxis: (id: string) => stateManager.deleteIdentityAxis(id),

    // Settings actions
    updateSettings: (settings: Partial<UserSettings>) =>
      stateManager.updateSettings(settings),

    // UI state actions
    setCurrentLayer: (layer: 'sovereign' | 'commons' | 'builder') =>
      stateManager.setCurrentLayer(layer),

    setCurrentThread: (threadId: string | null) =>
      stateManager.setCurrentThread(threadId),

    setCurrentIdentityAxis: (axisId: string | null) =>
      stateManager.setCurrentIdentityAxis(axisId),

    setCrisisMode: (enabled: boolean) => stateManager.setCrisisMode(enabled),

    // Data sovereignty
    exportAllData: () => stateManager.exportAllData(),
    importData: (data: any) => stateManager.importData(data),
    clearAllData: () => stateManager.clearAllData(),
  };
}

/**
 * useReflections - Get reflections with filters
 */
export function useReflections(filters?: {
  threadId?: string;
  layer?: 'sovereign' | 'commons' | 'builder';
  identityAxis?: string;
  tags?: string[];
}) {
  const { reflections } = useAppState();

  return reflections.filter(r => {
    if (filters?.threadId && r.threadId !== filters.threadId) return false;
    if (filters?.layer && r.layer !== filters.layer) return false;
    if (filters?.identityAxis && r.identityAxis !== filters.identityAxis) return false;
    if (filters?.tags && !filters.tags.some(tag => r.tags?.includes(tag))) return false;
    return true;
  });
}

/**
 * useThreads - Get threads sorted by recency
 */
export function useThreads() {
  const { threads } = useAppState();
  return [...threads].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

/**
 * useCurrentThread - Get currently selected thread with reflections
 */
export function useCurrentThread() {
  const { currentThread, threads, reflections } = useAppState();
  
  if (!currentThread) return null;

  const thread = threads.find(t => t.id === currentThread);
  if (!thread) return null;

  const threadReflections = reflections.filter(r => r.threadId === currentThread);

  return {
    thread,
    reflections: threadReflections,
  };
}

/**
 * useSettings - Get user settings with defaults
 */
export function useSettings() {
  const { settings, updateSettings } = useAppState();

  const defaultSettings: UserSettings = {
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

  return {
    settings: settings || defaultSettings,
    updateSettings,
  };
}