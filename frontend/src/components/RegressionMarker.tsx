import React, { useState } from 'react';
import { TrendingDown, AlertCircle, Calendar, BarChart3, Lightbulb, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * RegressionMarker - Pattern Regression Display
 * 
 * Features:
 * - Indicates when previous patterns resurface
 * - Compare current state to historical baseline
 * - Show recovery paths and strategies
 * - Timeline visualization of regression/recovery cycles
 * - Severity assessment and trend analysis
 * 
 * Constitutional Note: Regressions aren't failures—they're information
 * about patterns that may need different approaches.
 */

export type RegressionSeverity = 'minor' | 'moderate' | 'significant';

interface HistoricalBaseline {
  metric: string;
  baselineValue: number;
  currentValue: number;
  unit: string;
}

interface RecoveryStrategy {
  title: string;
  description: string;
  effectiveness: number; // 0-1, based on past data
}

interface TimelinePoint {
  date: string;
  value: number; // Metric value (e.g., tension energy, posture stability)
  label?: string; // Event label (e.g., "First detected", "Peak", "Recovered")
}

interface Regression {
  id: string;
  pattern: string;
  description: string;
  severity: RegressionSeverity;
  detectedAt: string;
  firstOccurrence: string;
  lastRecovery?: string;
  cycleDuration?: number; // days between regression cycles
  baselines: HistoricalBaseline[];
  recoveryStrategies: RecoveryStrategy[];
  timeline: TimelinePoint[];
  relatedTensions?: { id: string; label: string }[];
}

interface RegressionMarkerProps {
  regression: Regression;
  onViewTension?: (tensionId: string) => void;
  onExploreStrategy?: (strategyTitle: string) => void;
}

// Severity styles
const severityStyles = {
  minor: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    label: 'Minor'
  },
  moderate: {
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-500',
    label: 'Moderate'
  },
  significant: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-500',
    label: 'Significant'
  }
};

export function RegressionMarker({
  regression,
  onViewTension,
  onExploreStrategy
}: RegressionMarkerProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const styles = severityStyles[regression.severity];

  // Calculate days since first occurrence
  const daysSinceFirst = Math.floor(
    (new Date(regression.detectedAt).getTime() - new Date(regression.firstOccurrence).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Calculate days since last recovery (if exists)
  const daysSinceRecovery = regression.lastRecovery
    ? Math.floor(
        (new Date(regression.detectedAt).getTime() - new Date(regression.lastRecovery).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Card className={`border-l-4 ${styles.border}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className={`h-5 w-5 ${styles.color}`} />
              <CardTitle className="text-lg">Pattern Regression Detected</CardTitle>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{regression.pattern}</h3>
            <div className="flex items-center gap-2">
              <Badge className={`${styles.bg} ${styles.color} border-0`}>
                {styles.label} Severity
              </Badge>
              <span className="text-sm text-gray-500">
                Detected {new Date(regression.detectedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Description */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">What's Happening</h4>
          <p className="text-sm text-gray-700">{regression.description}</p>
        </div>

        {/* Timeline Context */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-500">First Occurrence</p>
            </div>
            <p className="font-medium text-gray-900">
              {new Date(regression.firstOccurrence).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">{daysSinceFirst} days ago</p>
          </div>
          {regression.lastRecovery && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500">Last Recovery</p>
              </div>
              <p className="font-medium text-gray-900">
                {new Date(regression.lastRecovery).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">{daysSinceRecovery} days ago</p>
            </div>
          )}
          {regression.cycleDuration && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500">Cycle Duration</p>
              </div>
              <p className="font-medium text-gray-900">{regression.cycleDuration} days</p>
              <p className="text-xs text-gray-500">Average between cycles</p>
            </div>
          )}
        </div>

        {/* Baselines Comparison */}
        {regression.baselines.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-600" />
              Comparison to Baseline
            </h4>
            <div className="space-y-3">
              {regression.baselines.map((baseline, index) => {
                const percentChange =
                  ((baseline.currentValue - baseline.baselineValue) / baseline.baselineValue) * 100;
                const isWorsening = percentChange > 0; // Assuming higher is worse (adjust per metric)

                return (
                  <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{baseline.metric}</span>
                      <Badge
                        className={`${
                          isWorsening
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        } border-0`}
                      >
                        {isWorsening ? '+' : ''}
                        {percentChange.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Baseline</p>
                        <p className="font-medium">
                          {baseline.baselineValue.toFixed(2)} {baseline.unit}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isWorsening ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (baseline.currentValue / baseline.baselineValue) * 100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Current</p>
                        <p className="font-medium">
                          {baseline.currentValue.toFixed(2)} {baseline.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Visualization */}
        <div>
          <Button
            variant="outline"
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between mb-3"
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Regression Timeline
            </span>
            {showTimeline ? <TrendingDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          {showTimeline && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={regression.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [value.toFixed(2), 'Value']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">
                Timeline showing pattern intensity over time
              </p>
            </div>
          )}
        </div>

        {/* Recovery Strategies */}
        {regression.recoveryStrategies.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-600" />
              Recovery Strategies
            </h4>
            <div className="space-y-3">
              {regression.recoveryStrategies.map((strategy, index) => (
                <div
                  key={index}
                  className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-emerald-900">{strategy.title}</h5>
                    <Badge variant="outline" className="text-xs">
                      {(strategy.effectiveness * 100).toFixed(0)}% effective
                    </Badge>
                  </div>
                  <p className="text-sm text-emerald-800 mb-3">{strategy.description}</p>
                  {onExploreStrategy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExploreStrategy(strategy.title)}
                      className="text-emerald-700 hover:text-emerald-900"
                    >
                      Explore This Strategy
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Effectiveness based on your past recovery patterns
            </p>
          </div>
        )}

        {/* Related Tensions */}
        {regression.relatedTensions && regression.relatedTensions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Related Tensions</h4>
            <div className="space-y-2">
              {regression.relatedTensions.map((tension) => (
                <button
                  key={tension.id}
                  onClick={() => onViewTension?.(tension.id)}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium text-left">{tension.label}</span>
                  {onViewTension && (
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Constitutional Note */}
        <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
          <strong>Regressions aren't failures:</strong> They're signals that a pattern 
          might need a different approach. Progress isn't linear—setbacks often contain 
          valuable information about what works and what doesn't.
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * <RegressionMarker
 *   regression={{
 *     id: 'regr_123',
 *     pattern: 'Avoiding Difficult Conversations',
 *     description: 'You\'re back to postponing conversations that make you uncomfortable, similar to patterns from 3 months ago.',
 *     severity: 'moderate',
 *     detectedAt: '2024-01-15T00:00:00Z',
 *     firstOccurrence: '2023-10-01T00:00:00Z',
 *     lastRecovery: '2023-12-01T00:00:00Z',
 *     cycleDuration: 45,
 *     baselines: [
 *       {
 *         metric: 'Conflict Avoidance Score',
 *         baselineValue: 0.35,
 *         currentValue: 0.72,
 *         unit: 'score'
 *       }
 *     ],
 *     recoveryStrategies: [
 *       {
 *         title: 'Micro-commitments',
 *         description: 'Start with tiny conversation steps—even 2 minutes counts',
 *         effectiveness: 0.78
 *       }
 *     ],
 *     timeline: [
 *       { date: '2023-10-01', value: 0.7 },
 *       { date: '2023-11-01', value: 0.5 },
 *       { date: '2023-12-01', value: 0.3 },
 *       { date: '2024-01-15', value: 0.72 }
 *     ],
 *     relatedTensions: [
 *       { id: 't1', label: 'Fear of conflict vs. need for honesty' }
 *     ]
 *   }}
 *   onViewTension={(id) => console.log('View tension:', id)}
 *   onExploreStrategy={(title) => console.log('Explore strategy:', title)}
 * />
 */
