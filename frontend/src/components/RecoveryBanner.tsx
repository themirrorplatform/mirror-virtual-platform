/**
 * Recovery Banner - Auto-Recovery UI
 * 
 * Constitutional Principles:
 * - User chooses to recover or discard
 * - Never automatic restoration
 * - Transparent about what was recovered
 * - Dismissible
 */

import { useState, useEffect } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { autoRecoveryService, RecoverySnapshot } from '../services/autoRecovery';

interface RecoveryBannerProps {
  onRecover: (content: string) => void;
  onDismiss: () => void;
}

export function RecoveryBanner({ onRecover, onDismiss }: RecoveryBannerProps) {
  const [snapshot, setSnapshot] = useState<RecoverySnapshot | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkRecovery = async () => {
      if (autoRecoveryService.hasRecovery()) {
        const age = autoRecoveryService.getRecoveryAge();
        if (age && age < 3600) { // Less than 1 hour old
          const recovered = await autoRecoveryService.getSnapshot();
          if (recovered && recovered.content.trim().length > 20) {
            setSnapshot(recovered);
            setShowBanner(true);
          }
        }
      }
    };

    checkRecovery();
  }, []);

  const handleRecover = async () => {
    if (snapshot) {
      onRecover(snapshot.content);
      autoRecoveryService.clearSnapshot();
      setShowBanner(false);
    }
  };

  const handleDiscard = () => {
    autoRecoveryService.clearSnapshot();
    setShowBanner(false);
    onDismiss();
  };

  if (!showBanner || !snapshot) return null;

  const age = Math.floor((Date.now() - snapshot.timestamp) / 1000);
  const minutes = Math.floor(age / 60);
  const timeAgo = minutes < 1 ? 'just now' : 
                  minutes === 1 ? '1 minute ago' :
                  minutes < 60 ? `${minutes} minutes ago` :
                  `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''} ago`;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top">
      <div className="
        bg-[var(--color-surface-card)] 
        border border-[var(--color-border-emphasis)]
        border-l-4 border-l-[var(--color-warning)]
        rounded-lg p-4 shadow-[var(--shadow-medium)]
        backdrop-blur-md
      ">
        <div className="flex items-start gap-4">
          <AlertCircle 
            size={20} 
            className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" 
          />
          
          <div className="flex-1">
            <p className="font-medium text-[var(--color-text-primary)] mb-1">
              Unsaved reflection found
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              Written {timeAgo} • {snapshot.content.length} characters
            </p>
            
            {/* Preview */}
            <div className="
              bg-[var(--color-base-default)] 
              border border-[var(--color-border-subtle)] 
              rounded-lg p-3 mb-3
            ">
              <p className="text-sm text-[var(--color-text-secondary)] italic line-clamp-2">
                {snapshot.content}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRecover}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-[var(--color-accent-gold)] text-black
                  hover:bg-[var(--color-accent-gold-deep)]
                  transition-colors font-medium text-sm
                "
              >
                <Check size={16} />
                Recover
              </button>
              
              <button
                onClick={handleDiscard}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  border border-[var(--color-border-subtle)]
                  hover:bg-[var(--color-surface-emphasis)]
                  text-[var(--color-text-secondary)]
                  transition-colors text-sm
                "
              >
                <X size={16} />
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
