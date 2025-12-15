/**
 * TPV Visualizer - Tension Proxy Vector Display
 * 
 * Shows transparency into Finder routing logic:
 * - Radar chart of active tensions across lenses
 * - Lens weights visualization
 * - Ambiguity score indicator
 * - Last computed timestamp
 * - Manual override option
 */

import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Activity, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Info,
  Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LensWeight {
  lensId: string;
  lensName: string;
  weight: number; // 0.0 - 1.0
  color: string;
}

interface TPVData {
  lensWeights: LensWeight[];
  ambiguityScore: number; // 0.0 - 1.0
  lastComputed: Date;
  dominantLens?: string;
  tensionCount: number;
}

interface TPVVisualizerProps {
  data: TPVData;
  onRefresh?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
  showExplainer?: boolean;
}

export function TPVVisualizer({
  data,
  onRefresh,
  onViewDetails,
  compact = false,
  showExplainer = true,
}: TPVVisualizerProps) {
  const timeSinceComputed = getTimeSince(data.lastComputed);
  const ambiguityLevel = getAmbiguityLevel(data.ambiguityScore);

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={20} className="text-[var(--color-accent-blue)]" />
            <h3>Tension Proxy Vector</h3>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {compact ? 'Routing transparency' : 'How the Finder computes your recommendations'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              aria-label="Recompute TPV"
            >
              <RefreshCw size={16} />
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
            >
              <Eye size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Ambiguity Score */}
      <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Ambiguity Score</span>
          <Badge variant={ambiguityLevel.variant} size="sm">
            {Math.round(data.ambiguityScore * 100)}%
          </Badge>
        </div>
        <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.ambiguityScore * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: ambiguityLevel.color }}
          />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          {ambiguityLevel.description}
        </p>
      </div>

      {/* Lens Weights */}
      {!compact && data.lensWeights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Active Lens Weights</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {data.lensWeights.length} active
            </span>
          </div>

          <div className="space-y-2">
            {data.lensWeights
              .sort((a, b) => b.weight - a.weight)
              .map((lens) => (
                <LensWeightBar key={lens.lensId} lens={lens} />
              ))}
          </div>
        </div>
      )}

      {/* Compact View */}
      {compact && data.lensWeights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.lensWeights
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 3)
            .map((lens) => (
              <Badge key={lens.lensId} variant="secondary" size="sm">
                {lens.lensName} {Math.round(lens.weight * 100)}%
              </Badge>
            ))}
          {data.lensWeights.length > 3 && (
            <Badge variant="secondary" size="sm">
              +{data.lensWeights.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1">
            <BarChart3 size={14} />
            <span>{data.tensionCount} tensions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>Updated {timeSinceComputed}</span>
          </div>
        </div>

        {data.dominantLens && (
          <Badge variant="primary" size="sm">
            Dominant: {data.dominantLens}
          </Badge>
        )}
      </div>

      {/* Explainer */}
      {showExplainer && !compact && (
        <Card>
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="text-xs text-[var(--color-text-secondary)]">
              <p className="mb-2">
                The <strong>TPV</strong> translates your identity tensions into routing weights. 
                Higher ambiguity means more uncertainty in the recommendation logic.
              </p>
              <p className="text-[var(--color-text-muted)]">
                This data is computed locally and never shared. The Finder uses it to select doors.
              </p>
            </div>
          </div>
        </Card>
      )}
    </Card>
  );
}

interface LensWeightBarProps {
  lens: LensWeight;
}

function LensWeightBar({ lens }: LensWeightBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {lens.lensName}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {Math.round(lens.weight * 100)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${lens.weight * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: lens.color }}
        />
      </div>
    </div>
  );
}

// Utility Functions

function getTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getAmbiguityLevel(score: number): {
  variant: 'success' | 'warning' | 'error';
  color: string;
  description: string;
} {
  if (score < 0.3) {
    return {
      variant: 'success',
      color: '#10B981',
      description: 'Low ambiguity - routing logic is confident',
    };
  }
  if (score < 0.7) {
    return {
      variant: 'warning',
      color: '#F59E0B',
      description: 'Medium ambiguity - some uncertainty in routing',
    };
  }
  return {
    variant: 'error',
    color: '#EF4444',
    description: 'High ambiguity - routing logic has significant uncertainty',
  };
}

export type { TPVData, LensWeight };


