/**
 * Emotion Tracker - Visualize emotional patterns over time
 * 
 * Features:
 * - Timeline graph of emotional valence
 * - Multiple emotion dimensions (joy, anger, fear, etc.)
 * - Trend analysis
 * - Context linking (what was happening)
 * - Trigger identification
 * - Export emotion data
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
  Download,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmotionDataPoint {
  timestamp: Date;
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
  dominantEmotion?: string;
  context?: string;
  reflectionId?: string;
}

interface EmotionTrackerProps {
  data: EmotionDataPoint[];
  onViewReflection?: (reflectionId: string) => void;
  onExport?: () => void;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const EMOTION_COLORS = {
  joy: '#10B981',
  sadness: '#3B82F6',
  anger: '#EF4444',
  fear: '#F59E0B',
  surprise: '#8B5CF6',
  disgust: '#64748B',
  neutral: '#94A3B8',
};

export function EmotionTracker({
  data,
  onViewReflection,
  onExport,
}: EmotionTrackerProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedPoint, setSelectedPoint] = useState<EmotionDataPoint | null>(null);

  const filteredData = filterByTimeRange(data, timeRange);
  const stats = calculateStats(filteredData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Heart size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">Emotion Tracker</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredData.length} data point{filteredData.length !== 1 ? 's' : ''} in range
                </p>
              </div>
            </div>

            {onExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExport}
                className="flex items-center gap-2"
              >
                <Download size={14} />
                Export
              </Button>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  timeRange === range
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Average Valence"
          value={formatValence(stats.averageValence)}
          trend={stats.valenceTrend}
          color={getValenceColor(stats.averageValence)}
        />
        <StatCard
          label="Average Arousal"
          value={`${Math.round(stats.averageArousal * 100)}%`}
          trend={stats.arousalTrend}
          color="#8B5CF6"
        />
        <StatCard
          label="Most Common"
          value={stats.mostCommonEmotion || 'Neutral'}
          color={EMOTION_COLORS[stats.mostCommonEmotion as keyof typeof EMOTION_COLORS] || EMOTION_COLORS.neutral}
        />
      </div>

      {/* Valence Timeline */}
      <Card>
        <div className="space-y-4">
          <h4 className="font-medium">Emotional Valence Over Time</h4>
          <ValenceGraph
            data={filteredData}
            onSelectPoint={setSelectedPoint}
            selectedPoint={selectedPoint}
          />
        </div>
      </Card>

      {/* Selected Point Details */}
      {selectedPoint && (
        <Card className="border-2 border-[var(--color-accent-blue)]">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">
                    {formatDate(selectedPoint.timestamp)}
                  </h4>
                  {selectedPoint.dominantEmotion && (
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${EMOTION_COLORS[selectedPoint.dominantEmotion as keyof typeof EMOTION_COLORS]}20`,
                        color: EMOTION_COLORS[selectedPoint.dominantEmotion as keyof typeof EMOTION_COLORS],
                      }}
                    >
                      {selectedPoint.dominantEmotion}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Valence: {formatValence(selectedPoint.valence)} • Arousal: {Math.round(selectedPoint.arousal * 100)}%
                </p>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>

            {selectedPoint.context && (
              <Card>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {selectedPoint.context}
                </p>
              </Card>
            )}

            {selectedPoint.reflectionId && onViewReflection && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewReflection(selectedPoint.reflectionId!)}
              >
                View Reflection
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Emotion Distribution */}
      <Card>
        <div className="space-y-4">
          <h4 className="font-medium">Emotion Distribution</h4>
          <EmotionDistribution data={filteredData} />
        </div>
      </Card>

      {/* Info */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>Emotion tracking is descriptive, not prescriptive.</strong> This data 
              shows patterns in your emotional landscape — it doesn't tell you what to feel.
            </p>
            <p className="text-[var(--color-text-muted)]">
              All emotion data is processed locally and never leaves your device. You can 
              export or delete this data at any time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Sub-components

interface StatCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color: string;
}

function StatCard({ label, value, trend, color }: StatCardProps) {
  return (
    <Card>
      <div className="space-y-2">
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-medium" style={{ color }}>
            {value}
          </span>
          {trend && (
            <div className="text-[var(--color-text-muted)]">
              {trend === 'up' && <TrendingUp size={16} />}
              {trend === 'down' && <TrendingDown size={16} />}
              {trend === 'stable' && <Minus size={16} />}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ValenceGraphProps {
  data: EmotionDataPoint[];
  onSelectPoint: (point: EmotionDataPoint) => void;
  selectedPoint: EmotionDataPoint | null;
}

function ValenceGraph({ data, onSelectPoint, selectedPoint }: ValenceGraphProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">
        No emotion data in this range
      </div>
    );
  }

  const maxX = Math.max(...data.map(d => d.timestamp.getTime()));
  const minX = Math.min(...data.map(d => d.timestamp.getTime()));

  return (
    <div className="relative h-64 bg-[var(--color-surface-hover)] rounded-lg p-4">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[var(--color-text-muted)] pr-2">
        <span>+1</span>
        <span>0</span>
        <span>-1</span>
      </div>

      {/* Zero line */}
      <div className="absolute left-8 right-0 top-1/2 h-px bg-[var(--color-border-subtle)]" />

      {/* Graph */}
      <div className="h-full ml-8 relative">
        <svg className="w-full h-full">
          {/* Line */}
          <polyline
            points={data
              .map((d, i) => {
                const x = ((d.timestamp.getTime() - minX) / (maxX - minX)) * 100;
                const y = ((1 - d.valence) / 2) * 100;
                return `${x}%,${y}%`;
              })
              .join(' ')}
            fill="none"
            stroke="var(--color-accent-blue)"
            strokeWidth="2"
          />

          {/* Points */}
          {data.map((d, i) => {
            const x = ((d.timestamp.getTime() - minX) / (maxX - minX)) * 100;
            const y = ((1 - d.valence) / 2) * 100;
            const isSelected = selectedPoint?.timestamp === d.timestamp;

            return (
              <circle
                key={i}
                cx={`${x}%`}
                cy={`${y}%`}
                r={isSelected ? 6 : 4}
                fill={d.dominantEmotion ? EMOTION_COLORS[d.dominantEmotion as keyof typeof EMOTION_COLORS] : 'var(--color-accent-blue)'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-6 transition-all"
                onClick={() => onSelectPoint(d)}
              />
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-[var(--color-text-muted)] pt-2">
        <span>{formatDate(new Date(minX))}</span>
        <span>{formatDate(new Date(maxX))}</span>
      </div>
    </div>
  );
}

function EmotionDistribution({ data }: { data: EmotionDataPoint[] }) {
  const emotionCounts: Record<string, number> = {};
  
  data.forEach(d => {
    if (d.dominantEmotion) {
      emotionCounts[d.dominantEmotion] = (emotionCounts[d.dominantEmotion] || 0) + 1;
    }
  });

  const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
  
  if (total === 0) {
    return (
      <div className="text-center py-6 text-sm text-[var(--color-text-muted)]">
        No emotion labels in this range
      </div>
    );
  }

  const emotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      {emotions.map(([emotion, count]) => {
        const percentage = (count / total) * 100;
        const color = EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] || EMOTION_COLORS.neutral;

        return (
          <div key={emotion} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{emotion}</span>
              </div>
              <span className="text-[var(--color-text-muted)]">
                {count} ({Math.round(percentage)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Utility Functions

function filterByTimeRange(data: EmotionDataPoint[], range: TimeRange): EmotionDataPoint[] {
  const now = Date.now();
  const cutoffs = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    'all': Infinity,
  };

  const cutoff = cutoffs[range];
  return data.filter(d => now - d.timestamp.getTime() < cutoff);
}

function calculateStats(data: EmotionDataPoint[]) {
  if (data.length === 0) {
    return {
      averageValence: 0,
      averageArousal: 0,
      valenceTrend: 'stable' as const,
      arousalTrend: 'stable' as const,
      mostCommonEmotion: null,
    };
  }

  const averageValence = data.reduce((sum, d) => sum + d.valence, 0) / data.length;
  const averageArousal = data.reduce((sum, d) => sum + d.arousal, 0) / data.length;

  // Calculate trends (compare first half to second half)
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstValence = firstHalf.reduce((sum, d) => sum + d.valence, 0) / firstHalf.length;
  const secondValence = secondHalf.reduce((sum, d) => sum + d.valence, 0) / secondHalf.length;
  const valenceTrend = secondValence > firstValence + 0.1 ? 'up' : secondValence < firstValence - 0.1 ? 'down' : 'stable';

  const firstArousal = firstHalf.reduce((sum, d) => sum + d.arousal, 0) / firstHalf.length;
  const secondArousal = secondHalf.reduce((sum, d) => sum + d.arousal, 0) / secondHalf.length;
  const arousalTrend = secondArousal > firstArousal + 0.1 ? 'up' : secondArousal < firstArousal - 0.1 ? 'down' : 'stable';

  // Most common emotion
  const emotionCounts: Record<string, number> = {};
  data.forEach(d => {
    if (d.dominantEmotion) {
      emotionCounts[d.dominantEmotion] = (emotionCounts[d.dominantEmotion] || 0) + 1;
    }
  });
  const mostCommonEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    averageValence,
    averageArousal,
    valenceTrend,
    arousalTrend,
    mostCommonEmotion,
  };
}

function formatValence(valence: number): string {
  if (valence > 0.3) return 'Positive';
  if (valence < -0.3) return 'Negative';
  return 'Neutral';
}

function getValenceColor(valence: number): string {
  if (valence > 0.3) return '#10B981';
  if (valence < -0.3) return '#EF4444';
  return '#94A3B8';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export type { EmotionDataPoint };


