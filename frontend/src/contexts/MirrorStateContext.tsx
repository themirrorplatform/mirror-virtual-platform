/**
 * MirrorStateContext - Constitutional State Provider
 * Provides layer, fork, and constitutional state throughout the app
 */

import { createContext, useContext, ReactNode } from 'react';
import { useMirrorState, MirrorState, Receipt, Layer, Modality } from '../hooks/useMirrorState';

interface MirrorStateContextValue {
  state: MirrorState;
  receipts: Receipt[];
  switchLayer: (layer: Layer) => void;
  enterFork: (forkId: string, forkName?: string) => void;
  exitFork: () => void;
  applyWorldview: (worldviewId: string, worldviewName?: string) => void;
  removeWorldview: (worldviewId: string) => void;
  acknowledgeLicense: (licenseId: string) => void;
  addReceipt: (receipt: Omit<Receipt, 'id' | 'timestamp'>) => void;
  dismissReceipt: (id: string) => void;
  clearReceipts: () => void;
  toggleCrisisMode: (enabled: boolean) => void;
  completeEntry: (layer: Layer) => void;
  setModality: (modality: Modality) => void;
  toggleParticles: (enabled?: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

const MirrorStateContext = createContext<MirrorStateContextValue | null>(null);

export function MirrorStateProvider({ children }: { children: ReactNode }) {
  const mirrorState = useMirrorState();

  return (
    <MirrorStateContext.Provider value={mirrorState}>
      {children}
    </MirrorStateContext.Provider>
  );
}

export function useMirrorStateContext() {
  const context = useContext(MirrorStateContext);
  if (!context) {
    throw new Error('useMirrorStateContext must be used within MirrorStateProvider');
  }
  return context;
}
