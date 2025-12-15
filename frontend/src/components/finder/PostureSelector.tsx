/**
 * Posture Selector - Foundation of Mirror Finder routing
 * 
 * 6 postures: unknown → overwhelmed → guarded → grounded → open → exploratory
 * Shows declared vs suggested, alerts on divergence
 */

import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  AlertTriangle, 
  Shield, 
  Anchor, 
  Smile, 
  Telescope,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type PostureType = 
  | 'unknown' 
  | 'overwhelmed' 
  | 'guarded' 
  | 'grounded' 
  | 'open' 
  | 'exploratory';

interface PostureOption {
  id: PostureType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const POSTURES: PostureOption[] = [
  {
    id: 'unknown',
    label: 'Unknown',
    description: 'Not sure how I am right now',
    icon: <HelpCircle size={24} />,
    color: 'var(--color-text-muted)',
    bgColor: 'var(--color-surface-card)',
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    description: 'Cannot process more right now',
    icon: <AlertTriangle size={24} />,
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  {
    id: 'guarded',
    label: 'Guarded',
    description: 'Protective, cautious, need safety',
    icon: <Shield size={24} />,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'grounded',
    label: 'Grounded',
    description: 'Stable, centered, can receive',
    icon: <Anchor size={24} />,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'open',
    label: 'Open',
    description: 'Curious, receptive, exploring',
    icon: <Smile size={24} />,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    id: 'exploratory',
    label: 'Exploratory',
    description: 'Seeking edges, ready for challenge',
    icon: <Telescope size={24} />,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
];

interface PostureSelectorProps {
  current: PostureType | null;
  suggested?: PostureType | null;
  onDeclare: (posture: PostureType) => void;
  showSuggested?: boolean;
  compact?: boolean;
}

export function PostureSelector({
  current,
  suggested,
  onDeclare,
  showSuggested = true,
  compact = false,
}: PostureSelectorProps) {
  const hasDivergence = showSuggested && suggested && current !== suggested;
  
  const getPosture = (id: PostureType) => 
    POSTURES.find(p => p.id === id);

  return (
    <div className="space-y-4">
      {/* Current Posture Display */}
      {current && (
        <Card className="border-2" style={{ 
          borderColor: getPosture(current)?.color,
          backgroundColor: getPosture(current)?.bgColor 
        }}>
          <div className="flex items-center gap-3">
            <div style={{ color: getPosture(current)?.color }}>
              {getPosture(current)?.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Current: {getPosture(current)?.label}</span>
              </div>
              {!compact && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {getPosture(current)?.description}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Divergence Alert */}
      {hasDivergence && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-[var(--color-border-warning)]" 
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-[var(--color-border-warning)] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-border-warning)] mb-1">
                  Suggested posture differs from declared
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  The Finder suggests <strong>{getPosture(suggested)?.label}</strong> based on your recent patterns. 
                  Your declared posture is respected—this is information, not direction.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Posture Grid */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {POSTURES.map((posture) => (
            <PostureButton
              key={posture.id}
              posture={posture}
              isCurrent={current === posture.id}
              isSuggested={suggested === posture.id}
              onClick={() => onDeclare(posture.id)}
            />
          ))}
        </div>
      )}

      {/* Compact Selector */}
      {compact && (
        <div className="flex flex-wrap gap-2">
          {POSTURES.map((posture) => (
            <button
              key={posture.id}
              onClick={() => onDeclare(posture.id)}
              className="px-3 py-2 rounded-lg border-2 transition-all hover:scale-105"
              style={{
                borderColor: current === posture.id ? posture.color : 'var(--color-border-subtle)',
                backgroundColor: current === posture.id ? posture.bgColor : 'transparent',
                color: current === posture.id ? posture.color : 'var(--color-text-secondary)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="scale-75">
                  {posture.icon}
                </div>
                <span className="text-sm font-medium">{posture.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Explainer */}
      {!compact && !current && (
        <Card>
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="text-sm text-[var(--color-text-secondary)]">
              <p className="mb-2">
                Your <strong>posture</strong> tells the Finder how to route recommendations.
              </p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Overwhelmed:</strong> Minimal doors, no complexity</li>
                <li>• <strong>Guarded:</strong> Safe, familiar patterns only</li>
                <li>• <strong>Grounded:</strong> Balanced, standard routing</li>
                <li>• <strong>Open:</strong> More exploration, gentle edges</li>
                <li>• <strong>Exploratory:</strong> Challenge, complexity, contradiction</li>
              </ul>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                The system suggests postures based on patterns, but you always decide.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface PostureButtonProps {
  posture: PostureOption;
  isCurrent: boolean;
  isSuggested: boolean;
  onClick: () => void;
}

function PostureButton({ posture, isCurrent, isSuggested, onClick }: PostureButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative p-4 rounded-xl border-2 transition-all text-left"
      style={{
        borderColor: isCurrent ? posture.color : 'var(--color-border-subtle)',
        backgroundColor: isCurrent ? posture.bgColor : 'var(--color-surface-card)',
      }}
    >
      {/* Suggested Badge */}
      {isSuggested && !isCurrent && (
        <div className="absolute top-2 right-2">
          <div className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]">
            Suggested
          </div>
        </div>
      )}

      {/* Current Badge */}
      {isCurrent && (
        <div className="absolute top-2 right-2">
          <div 
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${posture.color}20`,
              color: posture.color,
            }}
          >
            Current
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div style={{ color: isCurrent ? posture.color : 'var(--color-text-muted)' }}>
          {posture.icon}
        </div>
        <div className="flex-1">
          <div 
            className="font-medium mb-1"
            style={{ color: isCurrent ? posture.color : 'var(--color-text-primary)' }}
          >
            {posture.label}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {posture.description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}


