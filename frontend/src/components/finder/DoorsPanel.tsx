/**
 * Doors Panel - 3-door layout (bandwidth_limit)
 * 
 * Constitutional recommendation display:
 * - Default 3 doors (respects bandwidth limit)
 * - Refresh with rate limit indicator
 * - "Why these doors?" explainer
 * - Hide/block actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Info, 
  Clock,
  Settings
} from 'lucide-react';
import { DoorCard, type CardType, type InteractionStyle, type AsymmetryLevel } from './DoorCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Door {
  id: string;
  title: string;
  description: string;
  cardType: CardType;
  interactionStyle: InteractionStyle;
  lensTags: string[];
  attestationCount: number;
  asymmetryLevel: AsymmetryLevel;
  reflectiveCondition: string;
  creator?: string;
}

interface DoorsPanelProps {
  doors: Door[];
  bandwidthLimit?: number;
  onOpenDoor: (doorId: string) => void;
  onHideDoor?: (doorId: string) => void;
  onRefresh?: () => void;
  onViewAsymmetry?: (doorId: string) => void;
  onSettings?: () => void;
  refreshCooldown?: number; // seconds until next refresh
  showExplainer?: boolean;
}

export function DoorsPanel({
  doors,
  bandwidthLimit = 3,
  onOpenDoor,
  onHideDoor,
  onRefresh,
  onViewAsymmetry,
  onSettings,
  refreshCooldown = 0,
  showExplainer = true,
}: DoorsPanelProps) {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const visibleDoors = doors.slice(0, bandwidthLimit);
  const canRefresh = refreshCooldown === 0 && !isRefreshing;

  const handleRefresh = async () => {
    if (!canRefresh || !onRefresh) return;
    
    setIsRefreshing(true);
    await onRefresh();
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">Doors</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {visibleDoors.length} door{visibleDoors.length !== 1 ? 's' : ''} appear
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={!canRefresh}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 0.5, ease: 'linear', repeat: isRefreshing ? Infinity : 0 }}
              >
                <RefreshCw size={16} />
              </motion.div>
              <span>Refresh</span>
              {refreshCooldown > 0 && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Clock size={12} />
                  {refreshCooldown}s
                </span>
              )}
            </Button>
          )}

          {/* Settings */}
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              aria-label="Door settings"
            >
              <Settings size={16} />
            </Button>
          )}

          {/* Why These Doors? */}
          {showExplainer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWhyModal(true)}
              className="flex items-center gap-1"
            >
              <Info size={16} />
              <span>Why these?</span>
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {visibleDoors.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className="text-[var(--color-text-secondary)] mb-4">
              No doors appear right now.
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              The Finder is waiting. Check your posture or refresh.
            </p>
          </div>
        </Card>
      )}

      {/* Doors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {visibleDoors.map((door, index) => (
            <motion.div
              key={door.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <DoorCard
                door={door}
                onOpen={onOpenDoor}
                onHide={onHideDoor}
                onViewAsymmetry={onViewAsymmetry}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bandwidth Limit Indicator */}
      {doors.length > bandwidthLimit && (
        <Card className="border-2 border-[var(--color-border-warning)]">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[var(--color-border-warning)] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text-secondary)]">
                <strong>{doors.length - bandwidthLimit} more doors</strong> are available, 
                but your bandwidth limit is set to {bandwidthLimit}.
              </p>
              {onSettings && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSettings}
                  className="mt-2"
                >
                  Adjust Bandwidth Limit
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Why These Doors Modal */}
      <AnimatePresence>
        {showWhyModal && (
          <WhyTheseDoorsModal 
            doors={visibleDoors}
            onClose={() => setShowWhyModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface WhyTheseDoorsModalProps {
  doors: Door[];
  onClose: () => void;
}

function WhyTheseDoorsModal({ doors, onClose }: WhyTheseDoorsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="mb-1">Why These Doors?</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Constitutional routing logic explained
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <Card>
                <h4 className="mb-2 text-sm font-medium">Routing Logic</h4>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  The Finder selected these doors based on:
                </p>
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-accent-gold)]">1.</span>
                    <span><strong>Your declared posture</strong> (not assumed)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-accent-gold)]">2.</span>
                    <span><strong>Your active lenses</strong> and usage patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-accent-gold)]">3.</span>
                    <span><strong>Your identity graph tensions</strong> (never shared)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-accent-gold)]">4.</span>
                    <span><strong>Constitutional constraints</strong> (asymmetry limits)</span>
                  </li>
                </ul>
              </Card>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Door Breakdown</h4>
                {doors.map((door, index) => (
                  <Card key={door.id} variant="emphasis">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[var(--color-accent-gold)] font-medium">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-1">{door.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            <strong>Type:</strong> {door.cardType} • {door.interactionStyle}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            <strong>Matches lenses:</strong> {door.lensTags.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="border-2 border-[var(--color-accent-blue)]">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>This is not a recommendation algorithm.</strong> The Finder routes 
                  based on your explicit declarations, not engagement optimization. You can 
                  hide doors, adjust your posture, or turn the Finder off entirely.
                </p>
              </Card>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}


