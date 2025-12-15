/**
 * useMirrorState - Core state management for The Mirror
 * Manages layer, fork, worldview, and constitutional state
 */

import { useState, useEffect, useCallback } from 'react';

export interface MirrorState {
  // Core context
  layer: 'sovereign' | 'commons' | 'builder';
  fork: string | null;
  worldviews: string[];
  crisisMode: boolean;
  
  // Constitutional state
  activeConstitutions: string[];
  acknowledgedLicenses: string[];
  recognition: 'recognized' | 'conditional' | 'suspended' | 'revoked';
  provenance: 'local' | 'remote' | 'hybrid';
  
  // First-time user state
  hasSeenEntry: boolean;
  hasAcknowledgedCoreLicense: boolean;
  
  // Preferences
  particlesEnabled: boolean;
  themeOverride: 'light' | 'dark' | 'auto';
  
  // Current modality
  modality: 'text' | 'voice' | 'video' | 'longform';
}

export interface Receipt {
  id: string;
  type: 'layer_switch' | 'license' | 'constitution' | 'export' | 'fork_entry' | 'worldview' | 'refusal' | 'conflict_resolution';
  title: string;
  timestamp: Date;
  details: Record<string, any>;
}

const DEFAULT_STATE: MirrorState = {
  layer: 'sovereign',
  fork: null,
  worldviews: [],
  crisisMode: false,
  activeConstitutions: ['core-v1'],
  acknowledgedLicenses: [],
  recognition: 'recognized',
  provenance: 'local',
  hasSeenEntry: false,
  hasAcknowledgedCoreLicense: false,
  particlesEnabled: false,
  themeOverride: 'auto',
  modality: 'text',
};

export function useMirrorState() {
  const [state, setState] = useState<MirrorState>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('mirror_state');
    if (saved) {
      try {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('mirror_receipts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('mirror_state', JSON.stringify(state));
  }, [state]);

  // Persist receipts
  useEffect(() => {
    localStorage.setItem('mirror_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Actions
  const switchLayer = useCallback((newLayer: MirrorState['layer']) => {
    const oldLayer = state.layer;
    
    setState(prev => ({
      ...prev,
      layer: newLayer,
      // Update active constitutions based on layer
      activeConstitutions: ['core-v1', `${newLayer}-v1`],
    }));

    // Create receipt
    addReceipt({
      type: 'layer_switch',
      title: `Layer: ${newLayer}`,
      details: {
        from: oldLayer,
        to: newLayer,
        constitutions: ['core-v1', `${newLayer}-v1`],
      },
    });
  }, [state.layer]);

  const enterFork = useCallback((forkId: string) => {
    setState(prev => ({
      ...prev,
      fork: forkId,
      activeConstitutions: [...prev.activeConstitutions, `fork-${forkId}-v1`],
    }));

    addReceipt({
      type: 'fork_entry',
      title: `Fork: ${forkId}`,
      details: {
        forkId,
        timestamp: new Date(),
      },
    });
  }, []);

  const exitFork = useCallback(() => {
    const forkId = state.fork;
    
    setState(prev => ({
      ...prev,
      fork: null,
      activeConstitutions: prev.activeConstitutions.filter(c => !c.startsWith('fork-')),
    }));

    if (forkId) {
      addReceipt({
        type: 'fork_entry',
        title: `Exited fork: ${forkId}`,
        details: {
          forkId,
          action: 'exit',
        },
      });
    }
  }, [state.fork]);

  const applyWorldview = useCallback((worldviewId: string) => {
    setState(prev => ({
      ...prev,
      worldviews: [...prev.worldviews, worldviewId],
    }));

    addReceipt({
      type: 'worldview',
      title: `Worldview applied: ${worldviewId}`,
      details: {
        worldviewId,
        stackPosition: state.worldviews.length,
      },
    });
  }, [state.worldviews]);

  const removeWorldview = useCallback((worldviewId: string) => {
    setState(prev => ({
      ...prev,
      worldviews: prev.worldviews.filter(w => w !== worldviewId),
    }));

    addReceipt({
      type: 'worldview',
      title: `Worldview removed: ${worldviewId}`,
      details: {
        worldviewId,
        action: 'remove',
      },
    });
  }, []);

  const acknowledgeLicense = useCallback((licenseId: string) => {
    setState(prev => ({
      ...prev,
      acknowledgedLicenses: [...prev.acknowledgedLicenses, licenseId],
    }));

    addReceipt({
      type: 'license',
      title: `License: ${licenseId}`,
      details: {
        licenseId,
        acknowledgedAt: new Date(),
      },
    });
  }, []);

  const addReceipt = useCallback((receipt: Omit<Receipt, 'id' | 'timestamp'>) => {
    const newReceipt: Receipt = {
      ...receipt,
      id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };

    setReceipts(prev => [newReceipt, ...prev]);
  }, []);

  const dismissReceipt = useCallback((receiptId: string) => {
    setReceipts(prev => prev.filter(r => r.id !== receiptId));
  }, []);

  const toggleCrisisMode = useCallback((enabled?: boolean) => {
    setState(prev => ({
      ...prev,
      crisisMode: enabled !== undefined ? enabled : !prev.crisisMode,
    }));
  }, []);

  const completeEntry = useCallback((posture: MirrorState['layer']) => {
    setState(prev => ({
      ...prev,
      hasSeenEntry: true,
      layer: posture,
    }));
  }, []);

  const setModality = useCallback((modality: MirrorState['modality']) => {
    setState(prev => ({
      ...prev,
      modality,
    }));
  }, []);

  const toggleParticles = useCallback(() => {
    setState(prev => ({
      ...prev,
      particlesEnabled: !prev.particlesEnabled,
    }));
    localStorage.setItem('mirror_particles_enabled', String(!state.particlesEnabled));
  }, [state.particlesEnabled]);

  const setTheme = useCallback((theme: MirrorState['themeOverride']) => {
    setState(prev => ({
      ...prev,
      themeOverride: theme,
    }));
  }, []);

  return {
    state,
    receipts,
    
    // Actions
    switchLayer,
    enterFork,
    exitFork,
    applyWorldview,
    removeWorldview,
    acknowledgeLicense,
    addReceipt,
    dismissReceipt,
    toggleCrisisMode,
    completeEntry,
    setModality,
    toggleParticles,
    setTheme,
  };
}
