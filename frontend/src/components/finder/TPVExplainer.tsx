/**
 * TPV Explainer - Transparency about Transient Posture Value
 * 
 * Features:
 * - "What is TPV?" plain language explanation
 * - Calculation breakdown
 * - Current TPV display with components
 * - Constitutional framing (not a score)
 * - Interactive component weight visualization
 * - "Why did this change?" history
 */

import { useState } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info,
  Calculator,
  TrendingUp,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TPVComponent {
  name: string;
  value: number; // 0.0 - 1.0
  weight: number; // 0.0 - 1.0
  description: string;
}

interface TPVSnapshot {
  timestamp: Date;
  value: number;
  components: TPVComponent[];
}

interface TPVExplainerProps {
  currentTPV: number; // 0.0 - 1.0
  components: TPVComponent[];
  history?: TPVSnapshot[];
  postureName?: string;
  lensNames?: string[];
  showFullExplanation?: boolean;
}

export function TPVExplainer({
  currentTPV,
  components,
  history = [],
  postureName,
  lensNames = [],
  showFullExplanation = false,
}: TPVExplainerProps) {
  const [expanded, setExpanded] = useState(showFullExplanation);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const tpvPercentage = Math.round(currentTPV * 100);
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-4">
      {/* Main TPV Display */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10">
                <Calculator size={24} className="text-[var(--color-accent-blue)]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3>Your TPV</h3>
                  <Badge variant="primary">{tpvPercentage}%</Badge>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Transient Posture Value
                </p>
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {/* Current Context */}
          {(postureName || lensNames.length > 0) && (
            <div className="p-3 rounded-lg bg-[var(--color-surface-hover)] space-y-2">
              {postureName && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-muted)]">Posture:</span>
                  <Badge variant="secondary">{postureName}</Badge>
                </div>
              )}
              {lensNames.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-muted)]">Lenses:</span>
                  <div className="flex flex-wrap gap-1">
                    {lensNames.map((lens) => (
                      <Badge key={lens} variant="secondary" size="sm">
                        {lens}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Explanation */}
          <Card>
            <div className="flex items-start gap-3">
              <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                <strong>TPV is not a score.</strong> It's a momentary calculation based on your 
                current posture, active lenses, and identity state. It changes as you change.
              </p>
            </div>
          </Card>
        </div>
      </Card>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Component Breakdown */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">TPV Components</h4>
                  <button
                    onClick={() => setShowCalculation(!showCalculation)}
                    className="flex items-center gap-1 text-xs text-[var(--color-accent-blue)] hover:underline"
                  >
                    <HelpCircle size={12} />
                    {showCalculation ? 'Hide' : 'Show'} calculation
                  </button>
                </div>

                <div className="space-y-3">
                  {components.map((component) => (
                    <TPVComponentBar key={component.name} component={component} />
                  ))}
                </div>

                {/* Calculation Details */}
                {showCalculation && (
                  <Card>
                    <div className="space-y-2 text-xs font-mono">
                      <p className="text-[var(--color-text-muted)] mb-2">
                        Calculation:
                      </p>
                      {components.map((component) => (
                        <div key={component.name} className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)]">
                            {component.name}: {Math.round(component.value * 100)}% × {Math.round(component.weight * 100)}%
                          </span>
                          <span className="text-[var(--color-text-primary)]">
                            = {Math.round(component.value * component.weight * 100)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-[var(--color-border-subtle)] flex justify-between font-medium">
                        <span className="text-[var(--color-text-secondary)]">
                          Total / {Math.round(totalWeight * 100)}:
                        </span>
                        <span className="text-[var(--color-accent-blue)]">
                          {tpvPercentage}%
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            {/* Full Explanation */}
            <Card>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">What is TPV?</h4>
                
                <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <p>
                    <strong>TPV (Transient Posture Value)</strong> is a temporary number that 
                    represents alignment between your current state and available doors.
                  </p>

                  <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                      TPV is calculated from:
                    </p>
                    <ul className="space-y-1 text-xs">
                      {components.map((component) => (
                        <li key={component.name}>
                          • <strong>{component.name}:</strong> {component.description}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p>
                    <strong>Important:</strong> TPV is not a measure of "readiness" or "progress." 
                    It simply helps the system suggest doors that match where you are right now.
                  </p>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    When you change your posture or lenses, your TPV recalculates instantly. 
                    It has no memory and no judgment.
                  </p>
                </div>
              </div>
            </Card>

            {/* History */}
            {history.length > 0 && (
              <Card>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">TPV History</h4>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs text-[var(--color-accent-blue)] hover:underline"
                    >
                      {showHistory ? 'Hide' : 'Show'} recent changes
                    </button>
                  </div>

                  {showHistory && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {history.slice(0, 5).map((snapshot, index) => (
                        <div
                          key={index}
                          className="p-2 rounded-lg bg-[var(--color-surface-hover)]"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {formatTimestamp(snapshot.timestamp)}
                            </span>
                            <Badge variant="secondary" size="sm">
                              {Math.round(snapshot.value * 100)}%
                            </Badge>
                          </div>
                          {snapshot.value !== currentTPV && (
                            <div className="flex items-center gap-1 text-xs">
                              <TrendingUp
                                size={12}
                                className={
                                  snapshot.value > currentTPV
                                    ? 'text-[var(--color-accent-green)]'
                                    : 'text-[var(--color-border-error)]'
                                }
                              />
                              <span className="text-[var(--color-text-muted)]">
                                {snapshot.value > currentTPV ? 'Higher' : 'Lower'} than current
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Constitutional Notice */}
            <Card className="border-2 border-[var(--color-accent-blue)]">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                  <p>
                    <strong>TPV is constitutionally constrained.</strong> It cannot be used to:
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• Rank you against others</li>
                    <li>• Measure "progress" or "achievement"</li>
                    <li>• Restrict access to any feature</li>
                    <li>• Incentivize any specific behavior</li>
                  </ul>
                  <p className="text-[var(--color-text-muted)] mt-2">
                    TPV exists only to help match you with relevant doors in a given moment.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TPVComponentBarProps {
  component: TPVComponent;
}

function TPVComponentBar({ component }: TPVComponentBarProps) {
  const contributionPercentage = Math.round(component.value * component.weight * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h5 className="text-sm font-medium">{component.name}</h5>
          <p className="text-xs text-[var(--color-text-muted)]">
            {component.description}
          </p>
        </div>
        <Badge variant="secondary">
          {contributionPercentage}%
        </Badge>
      </div>

      {/* Value Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Value</span>
          <span>{Math.round(component.value * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${component.value * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-[var(--color-accent-blue)] rounded-full"
          />
        </div>
      </div>

      {/* Weight Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Weight</span>
          <span>{Math.round(component.weight * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${component.weight * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="h-full bg-[var(--color-accent-green)] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}

// Utility Functions

function formatTimestamp(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

export type { TPVComponent, TPVSnapshot };


