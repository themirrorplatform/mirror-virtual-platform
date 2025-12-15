/**
 * Governance Page - Hybrid Implementation
 * 
 * Multi-Guardian governance with 3-of-5 threshold signatures
 */

import { GovernanceHybrid } from '@/components/GovernanceHybrid';
import { useUIMode } from '@/contexts/UIModeContext';

export default function GovernancePage() {
  const { isSimpleMode } = useUIMode();

  // Simple Mode: show header
  if (isSimpleMode) {
    return (
      <div className="h-full flex flex-col">
        <header className="border-b border-[var(--color-border-subtle)] px-6 py-4">
          <h1 className="text-2xl font-serif text-[var(--color-accent-gold)]">Governance</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Multi-Guardian threshold signatures • 3-of-5 required for amendments
          </p>
        </header>
        <div className="flex-1">
          <GovernanceHybrid />
        </div>
      </div>
    );
  }

  // Power Mode: full screen
  return (
    <div className="h-screen">
      <GovernanceHybrid />
    </div>
  );
}
