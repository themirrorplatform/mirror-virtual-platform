/**
 * Attestation Badge - Trust signal for published content
 * 
 * Features:
 * - Attestation count display
 * - Attester preview (avatars/initials)
 * - Add/remove attestation
 * - "What is this?" explainer
 * - Constitutional framing (witnessing, not endorsement)
 * - Attestation details on hover
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  Eye,
  Plus,
  X,
  Info,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Attester {
  id: string;
  name: string;
  initials: string;
  attestedAt: Date;
}

interface AttestationBadgeProps {
  count: number;
  attesters?: Attester[];
  hasUserAttested?: boolean;
  onAttest?: () => void;
  onRemoveAttestation?: () => void;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'full';
}

export function AttestationBadge({
  count,
  attesters = [],
  hasUserAttested = false,
  onAttest,
  onRemoveAttestation,
  showDetails = false,
  size = 'md',
  variant = 'minimal',
}: AttestationBadgeProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [showAttesterList, setShowAttesterList] = useState(showDetails);

  const sizeConfig = {
    sm: { 
      iconSize: 12, 
      textSize: 'text-xs', 
      avatarSize: 'w-5 h-5',
      padding: 'px-2 py-1'
    },
    md: { 
      iconSize: 16, 
      textSize: 'text-sm', 
      avatarSize: 'w-6 h-6',
      padding: 'px-3 py-1.5'
    },
    lg: { 
      iconSize: 20, 
      textSize: 'text-base', 
      avatarSize: 'w-8 h-8',
      padding: 'px-4 py-2'
    },
  };

  const config = sizeConfig[size];
  const displayedAttesters = attesters.slice(0, 3);
  const remainingCount = Math.max(0, attesters.length - 3);

  if (variant === 'minimal') {
    return (
      <div className="relative inline-flex items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAttesterList(!showAttesterList)}
          className={`flex items-center gap-1.5 rounded-full bg-[var(--color-surface-hover)] ${config.padding} ${config.textSize} text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-blue)]/10 hover:text-[var(--color-accent-blue)] transition-all`}
        >
          <Shield size={config.iconSize} />
          <span className="font-medium">{count}</span>
          {hasUserAttested && (
            <Check size={config.iconSize} className="text-[var(--color-accent-green)]" />
          )}
        </motion.button>

        {/* Attester List Popup */}
        <AnimatePresence>
          {showAttesterList && attesters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full mt-2 left-0 z-20"
            >
              <Card className="shadow-lg min-w-64">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">
                      {count} Attestation{count !== 1 ? 's' : ''}
                    </h5>
                    <button
                      onClick={() => setShowAttesterList(false)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attesters.map((attester) => (
                      <div
                        key={attester.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div className="w-6 h-6 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center text-[var(--color-accent-blue)] font-medium">
                          {attester.initials}
                        </div>
                        <div className="flex-1">
                          <p className="text-[var(--color-text-secondary)]">
                            {attester.name}
                          </p>
                          <p className="text-[var(--color-text-muted)]">
                            {formatDate(attester.attestedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowExplainer(!showExplainer)}
                    className="flex items-center gap-1 text-xs text-[var(--color-accent-blue)] hover:underline"
                  >
                    <Info size={12} />
                    What is attestation?
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-3">
      <Card>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-accent-blue)]/10">
                <Shield size={20} className="text-[var(--color-accent-blue)]" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">
                  {count} Attestation{count !== 1 ? 's' : ''}
                </h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {hasUserAttested ? 'You have attested to this' : 'Witnessing, not endorsement'}
                </p>
              </div>
            </div>

            {hasUserAttested ? (
              onRemoveAttestation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveAttestation}
                  className="flex items-center gap-1"
                >
                  <X size={14} />
                  Remove
                </Button>
              )
            ) : (
              onAttest && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAttest}
                  className="flex items-center gap-1"
                >
                  <Plus size={14} />
                  Attest
                </Button>
              )
            )}
          </div>

          {/* Attester Avatars */}
          {attesters.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {displayedAttesters.map((attester) => (
                  <div
                    key={attester.id}
                    className={`${config.avatarSize} rounded-full bg-[var(--color-accent-blue)]/20 border-2 border-[var(--color-surface-card)] flex items-center justify-center text-[var(--color-accent-blue)] text-xs font-medium`}
                    title={attester.name}
                  >
                    {attester.initials}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div
                    className={`${config.avatarSize} rounded-full bg-[var(--color-surface-hover)] border-2 border-[var(--color-surface-card)] flex items-center justify-center text-[var(--color-text-muted)] text-xs font-medium`}
                  >
                    +{remainingCount}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAttesterList(!showAttesterList)}
                className="text-xs text-[var(--color-accent-blue)] hover:underline"
              >
                {showAttesterList ? 'Hide' : 'View all'}
              </button>
            </div>
          )}

          {/* Attester List */}
          <AnimatePresence>
            {showAttesterList && attesters.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-3 border-t border-[var(--color-border-subtle)]"
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {attesters.map((attester) => (
                    <div
                      key={attester.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-surface-hover)]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center text-[var(--color-accent-blue)] font-medium text-sm">
                        {attester.initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {attester.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Attested {formatDate(attester.attestedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Explainer */}
      <AnimatePresence>
        {showExplainer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-[var(--color-accent-blue)]">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                  <p className="font-medium">
                    Attestation is witnessing, not endorsement.
                  </p>
                  <p>
                    When you attest to content, you're saying "I have witnessed this" 
                    or "This resonated with me," not "This is correct" or "Everyone should see this."
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    Attestations are not used to rank or promote content. They exist as a 
                    trust signal in the Commons, nothing more.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Explainer Button */}
      <button
        onClick={() => setShowExplainer(!showExplainer)}
        className="flex items-center gap-1 text-xs text-[var(--color-accent-blue)] hover:underline"
      >
        <Info size={12} />
        {showExplainer ? 'Hide' : 'What is attestation?'}
      </button>
    </div>
  );
}

// Utility Functions

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

export type { Attester };

