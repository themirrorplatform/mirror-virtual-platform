/**
 * Identity Snapshot - Current identity state overview
 * 
 * Features:
 * - Current tensions list
 * - Paradoxes visualization
 * - Goals tracker
 * - Recurring loops alert
 * - Regressions timeline
 * - Dominant tension highlight
 * - Big question display
 * - Emotional baseline graph
 * - Oscillation pattern chart
 */

import { motion } from 'motion/react';
import { 
  Activity,
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Lightbulb,
  Heart,
  Zap
} from 'lucide-react';
import { Card } from '../Card';
import { Badge } from '../finder/Badge';

interface Tension {
  id: string;
  description: string;
  energy: number; // 0.0 - 1.0
  duration: number; // days
  lensTag: string;
}

interface Paradox {
  id: string;
  nodeA: string;
  nodeB: string;
  description: string;
  strength: number; // 0.0 - 1.0
}

interface Goal {
  id: string;
  description: string;
  progress: number; // 0.0 - 1.0
  lastUpdated: Date;
}

interface Loop {
  id: string;
  pattern: string;
  frequency: number; // occurrences
  lastSeen: Date;
}

interface Regression {
  id: string;
  type: 'loop' | 'self_attack' | 'judgment_spike' | 'avoidance';
  severity: number; // 1-5
  timestamp: Date;
  description: string;
}

interface IdentitySnapshotData {
  tensions: Tension[];
  paradoxes: Paradox[];
  goals: Goal[];
  loops: Loop[];
  regressions: Regression[];
  dominantTension?: Tension;
  bigQuestion?: string;
  emotionalBaseline: number; // -1.0 to 1.0
  oscillationLevel: number; // 0.0 - 1.0
}

interface IdentitySnapshotProps {
  data: IdentitySnapshotData;
  onViewDetails?: (section: string) => void;
  compact?: boolean;
}

export function IdentitySnapshot({
  data,
  onViewDetails,
  compact = false,
}: IdentitySnapshotProps) {
  const topTensions = data.tensions
    .sort((a, b) => b.energy - a.energy)
    .slice(0, compact ? 3 : 5);

  const recentLoops = data.loops
    .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
    .slice(0, 3);

  const recentRegressions = data.regressions
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Dominant Tension */}
      {data.dominantTension && (
        <Card className="border-2 border-[var(--color-accent-gold)]">
          <div className="flex items-start gap-3">
            <Zap size={24} className="text-[var(--color-accent-gold)] mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">Dominant Tension</h4>
                <Badge variant="warning">
                  {Math.round(data.dominantTension.energy * 100)}% energy
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                {data.dominantTension.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <span>Active for {data.dominantTension.duration} days</span>
                <span>•</span>
                <span>Lens: {data.dominantTension.lensTag}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Big Question */}
      {data.bigQuestion && !compact && (
        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-[var(--color-accent-blue)] mt-1" />
            <div>
              <h4 className="text-sm font-medium mb-2">Your Big Question Right Now</h4>
              <p className="text-sm text-[var(--color-text-secondary)] italic">
                "{data.bigQuestion}"
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Emotional Baseline */}
      {!compact && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-medium">Emotional Baseline</h4>
            </div>

            <div className="relative">
              <div className="w-full h-8 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full opacity-20" />
              <motion.div
                initial={{ left: '50%' }}
                animate={{ left: `${(data.emotionalBaseline + 1) * 50}%` }}
                transition={{ duration: 0.5 }}
                className="absolute top-0 w-2 h-8 bg-white border-2 border-[var(--color-border-primary)] rounded-full"
                style={{ transform: 'translateX(-50%)' }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>Low</span>
              <span>Neutral</span>
              <span>High</span>
            </div>
          </div>
        </Card>
      )}

      {/* Active Tensions */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-medium">Active Tensions</h4>
            </div>
            <Badge variant="secondary">{data.tensions.length}</Badge>
          </div>

          {topTensions.length > 0 ? (
            <div className="space-y-2">
              {topTensions.map((tension) => (
                <TensionCard key={tension.id} tension={tension} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              No active tensions detected
            </p>
          )}

          {data.tensions.length > topTensions.length && (
            <button
              onClick={() => onViewDetails?.('tensions')}
              className="text-xs text-[var(--color-accent-blue)] hover:underline"
            >
              View all {data.tensions.length} tensions
            </button>
          )}
        </div>
      </Card>

      {/* Paradoxes */}
      {!compact && data.paradoxes.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[var(--color-border-warning)]" />
              <h4 className="text-sm font-medium">Active Paradoxes</h4>
            </div>

            <div className="space-y-2">
              {data.paradoxes.slice(0, 3).map((paradox) => (
                <ParadoxCard key={paradox.id} paradox={paradox} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Goals */}
      {!compact && data.goals.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-medium">Goals</h4>
            </div>

            <div className="space-y-3">
              {data.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Recurring Loops */}
      {recentLoops.length > 0 && (
        <Card className="border-2 border-[var(--color-border-warning)]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw size={18} className="text-[var(--color-border-warning)]" />
              <h4 className="text-sm font-medium">Recurring Loops</h4>
            </div>

            <div className="space-y-2">
              {recentLoops.map((loop) => (
                <LoopCard key={loop.id} loop={loop} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Regressions */}
      {!compact && recentRegressions.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-medium">Recent Regressions</h4>
            </div>

            <div className="space-y-2">
              {recentRegressions.map((regression) => (
                <RegressionCard key={regression.id} regression={regression} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Oscillation Level */}
      {!compact && (
        <Card variant="emphasis">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Identity Oscillation</h4>
              <Badge 
                variant={data.oscillationLevel > 0.7 ? 'warning' : 'secondary'}
              >
                {Math.round(data.oscillationLevel * 100)}%
              </Badge>
            </div>

            <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.oscillationLevel * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: data.oscillationLevel > 0.7 ? '#F59E0B' : '#3B82F6',
                }}
              />
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              {data.oscillationLevel < 0.3 
                ? 'Low oscillation - identity is relatively stable'
                : data.oscillationLevel < 0.7
                ? 'Moderate oscillation - some shifting patterns'
                : 'High oscillation - significant identity flux'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Sub-components

interface TensionCardProps {
  tension: Tension;
}

function TensionCard({ tension }: TensionCardProps) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-[var(--color-text-secondary)] flex-1">
          {tension.description}
        </p>
        <Badge variant="secondary" size="sm">
          {Math.round(tension.energy * 100)}%
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span>{tension.duration}d</span>
        <span>•</span>
        <span>{tension.lensTag}</span>
      </div>
      <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden mt-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${tension.energy * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-[var(--color-accent-gold)] rounded-full"
        />
      </div>
    </div>
  );
}

interface ParadoxCardProps {
  paradox: Paradox;
}

function ParadoxCard({ paradox }: ParadoxCardProps) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-border-warning)]/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{paradox.nodeA}</span>
          <span className="text-[var(--color-text-muted)]">↔</span>
          <span className="font-medium">{paradox.nodeB}</span>
        </div>
        <Badge variant="warning" size="sm">
          {Math.round(paradox.strength * 100)}%
        </Badge>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {paradox.description}
      </p>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
}

function GoalCard({ goal }: GoalCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {goal.description}
        </p>
        <Badge variant="secondary" size="sm">
          {Math.round(goal.progress * 100)}%
        </Badge>
      </div>
      <div className="w-full h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${goal.progress * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-[var(--color-accent-green)] rounded-full"
        />
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Updated {formatDate(goal.lastUpdated)}
      </p>
    </div>
  );
}

interface LoopCardProps {
  loop: Loop;
}

function LoopCard({ loop }: LoopCardProps) {
  return (
    <div className="p-2 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--color-text-secondary)]">{loop.pattern}</p>
        <Badge variant="warning" size="sm">
          {loop.frequency}x
        </Badge>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Last seen {formatDate(loop.lastSeen)}
      </p>
    </div>
  );
}

interface RegressionCardProps {
  regression: Regression;
}

function RegressionCard({ regression }: RegressionCardProps) {
  const severityColor = 
    regression.severity >= 4 ? '#EF4444' :
    regression.severity >= 3 ? '#F59E0B' : '#64748B';

  return (
    <div className="p-2 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingDown size={14} style={{ color: severityColor }} />
          <p className="text-sm text-[var(--color-text-secondary)]">
            {regression.description}
          </p>
        </div>
        <Badge 
          variant={regression.severity >= 4 ? 'error' : 'warning'} 
          size="sm"
        >
          {regression.severity}/5
        </Badge>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        {formatDate(regression.timestamp)}
      </p>
    </div>
  );
}

// Utilities

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export type { IdentitySnapshotData, Tension, Paradox, Goal, Loop, Regression };
