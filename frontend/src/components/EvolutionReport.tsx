import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

/**
 * EvolutionReport - Long-Term Pattern Changes
 * 
 * Features:
 * - Track identity graph evolution over extended periods
 * - Visualize node strength changes
 * - Tension emergence and resolution trends
 * - Pattern lifecycle analysis
 * - Breakthrough moments identification
 * - Regression detection timeline
 * - Growth trajectory visualization
 * - Comparison across time periods
 * 
 * Constitutional Note: This shows YOUR growth journey - a record of
 * how your mind has evolved. It's for reflection and insight, not judgment.
 */

interface NodeEvolutionSummary {
  nodeType: string;
  created: number;
  strengthened: number;
  weakened: number;
  dissolved: number;
}

interface TensionTrend {
  period: string;
  emerged: number;
  resolved: number;
  avgDuration: number;
  avgEnergy: number;
}

interface PatternLifecycle {
  id: string;
  patternType: string;
  label: string;
  emergedDate: string;
  resolvedDate?: string;
  duration: number; // days
  peakIntensity: number;
  outcome: 'resolved' | 'ongoing' | 'transformed' | 'dissolved';
}

interface BreakthroughMoment {
  id: string;
  date: string;
  description: string;
  impact: 'major' | 'moderate' | 'minor';
  nodesAffected: number;
  tensionsResolved: number;
  newPatternsEmerged: number;
}

interface RegressionEvent {
  id: string;
  date: string;
  regressionType: string;
  severity: number;
  recovered: boolean;
  recoveryDays?: number;
}

interface GrowthMetrics {
  period: string;
  overallGrowth: number; // -1 to 1 score
  nodeComplexity: number;
  tensionManagement: number;
  emotionalRange: number;
  integrationCapacity: number;
}

interface EvolutionReportProps {
  startDate: string;
  endDate: string;
  nodeEvolution: NodeEvolutionSummary[];
  tensionTrends: TensionTrend[];
  patternLifecycles: PatternLifecycle[];
  breakthroughs: BreakthroughMoment[];
  regressions: RegressionEvent[];
  growthMetrics: GrowthMetrics[];
  onViewPattern?: (patternId: string) => void;
  onViewBreakthrough?: (breakthroughId: string) => void;
}

const nodeTypeColors: Record<string, string> = {
  thought: 'bg-blue-100 text-blue-700',
  belief: 'bg-purple-100 text-purple-700',
  emotion: 'bg-pink-100 text-pink-700',
  action: 'bg-emerald-100 text-emerald-700',
  experience: 'bg-amber-100 text-amber-700',
  consequence: 'bg-red-100 text-red-700'
};

const outcomeConfig = {
  resolved: { color: 'bg-emerald-600 text-white', label: 'Resolved', icon: CheckCircle },
  ongoing: { color: 'bg-blue-600 text-white', label: 'Ongoing', icon: Activity },
  transformed: { color: 'bg-purple-600 text-white', label: 'Transformed', icon: Sparkles },
  dissolved: { color: 'bg-gray-600 text-white', label: 'Dissolved', icon: TrendingDown }
};

const impactConfig = {
  major: { color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Major Breakthrough' },
  moderate: { color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Moderate Shift' },
  minor: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Minor Insight' }
};

export function EvolutionReport({
  startDate,
  endDate,
  nodeEvolution,
  tensionTrends,
  patternLifecycles,
  breakthroughs,
  regressions,
  growthMetrics,
  onViewPattern,
  onViewBreakthrough
}: EvolutionReportProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'nodes' | 'tensions' | 'patterns' | 'breakthroughs'>('overview');

  // Calculate summary stats
  const totalNodesCreated = nodeEvolution.reduce((sum, n) => sum + n.created, 0);
  const totalTensionsResolved = tensionTrends.reduce((sum, t) => sum + t.resolved, 0);
  const majorBreakthroughs = breakthroughs.filter(b => b.impact === 'major').length;
  const recoveredRegressions = regressions.filter(r => r.recovered).length;

  const avgGrowth = growthMetrics.reduce((sum, m) => sum + m.overallGrowth, 0) / (growthMetrics.length || 1);
  const latestMetrics = growthMetrics[growthMetrics.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-purple-600" />
          Evolution Report
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Your identity graph journey from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Nodes Created</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalNodesCreated}</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tensions Resolved</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{totalTensionsResolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Breakthroughs</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{majorBreakthroughs}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Growth</p>
                <p className={`text-2xl font-bold mt-1 ${
                  avgGrowth > 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {avgGrowth > 0 ? '+' : ''}{(avgGrowth * 100).toFixed(0)}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${
                avgGrowth > 0 ? 'text-emerald-600' : 'text-amber-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        {(['overview', 'nodes', 'tensions', 'patterns', 'breakthroughs'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              viewMode === mode
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Overview */}
      {viewMode === 'overview' && (
        <>
          {/* Growth Trajectory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Growth Trajectory</CardTitle>
              <p className="text-sm text-gray-500">
                Multi-dimensional growth over time
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis domain={[-1, 1]} style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="overallGrowth" stroke="#8b5cf6" strokeWidth={3} name="Overall Growth" />
                  <Line type="monotone" dataKey="tensionManagement" stroke="#10b981" strokeWidth={2} name="Tension Management" />
                  <Line type="monotone" dataKey="integrationCapacity" stroke="#3b82f6" strokeWidth={2} name="Integration" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Latest Metrics */}
          {latestMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current State</CardTitle>
                <p className="text-sm text-gray-500">Latest growth metrics</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Node Complexity', value: latestMetrics.nodeComplexity, color: 'blue' },
                    { label: 'Tension Management', value: latestMetrics.tensionManagement, color: 'emerald' },
                    { label: 'Emotional Range', value: latestMetrics.emotionalRange, color: 'pink' },
                    { label: 'Integration Capacity', value: latestMetrics.integrationCapacity, color: 'purple' }
                  ].map(metric => (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                        <span className="text-sm font-bold text-gray-900">
                          {(metric.value * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${metric.color}-600 transition-all`}
                          style={{ width: `${metric.value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Node Evolution */}
      {viewMode === 'nodes' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Node Evolution by Type</CardTitle>
            <p className="text-sm text-gray-500">
              How different node types have changed
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nodeEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nodeType" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="created" fill="#10b981" name="Created" />
                <Bar dataKey="strengthened" fill="#3b82f6" name="Strengthened" />
                <Bar dataKey="weakened" fill="#f59e0b" name="Weakened" />
                <Bar dataKey="dissolved" fill="#ef4444" name="Dissolved" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-3">
              {nodeEvolution.map(node => (
                <div key={node.nodeType} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`${nodeTypeColors[node.nodeType] || 'bg-gray-100 text-gray-700'} border-0 capitalize`}>
                      {node.nodeType}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Net: {node.created + node.strengthened - node.weakened - node.dissolved}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold text-emerald-600">{node.created}</p>
                      <p className="text-gray-500">Created</p>
                    </div>
                    <div>
                      <p className="font-bold text-blue-600">{node.strengthened}</p>
                      <p className="text-gray-500">Strengthened</p>
                    </div>
                    <div>
                      <p className="font-bold text-amber-600">{node.weakened}</p>
                      <p className="text-gray-500">Weakened</p>
                    </div>
                    <div>
                      <p className="font-bold text-red-600">{node.dissolved}</p>
                      <p className="text-gray-500">Dissolved</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tension Trends */}
      {viewMode === 'tensions' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tension Dynamics</CardTitle>
            <p className="text-sm text-gray-500">
              How tensions have emerged and resolved over time
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tensionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line type="monotone" dataKey="emerged" stroke="#f59e0b" strokeWidth={2} name="Emerged" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-2">
              {tensionTrends.map((trend, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{trend.period}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-amber-600">+{trend.emerged} emerged</span>
                      <span className="text-emerald-600">−{trend.resolved} resolved</span>
                      <span className="text-gray-500">{trend.avgDuration.toFixed(0)}d avg</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Lifecycles */}
      {viewMode === 'patterns' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pattern Lifecycles</CardTitle>
            <p className="text-sm text-gray-500">
              Journey of significant patterns
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patternLifecycles.map(pattern => {
                const config = outcomeConfig[pattern.outcome];
                const OutcomeIcon = config.icon;

                return (
                  <button
                    key={pattern.id}
                    onClick={() => onViewPattern?.(pattern.id)}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {pattern.patternType}
                          </Badge>
                          <Badge className={`${config.color} border-0 flex items-center gap-1`}>
                            <OutcomeIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-900">{pattern.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-purple-600">
                          {pattern.duration}d
                        </p>
                        <p className="text-xs text-gray-500">Duration</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Emerged: {new Date(pattern.emergedDate).toLocaleDateString()}</span>
                      {pattern.resolvedDate && (
                        <span>Resolved: {new Date(pattern.resolvedDate).toLocaleDateString()}</span>
                      )}
                      <span className="ml-auto">Peak: {(pattern.peakIntensity * 100).toFixed(0)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakthroughs */}
      {viewMode === 'breakthroughs' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Breakthrough Moments
              </CardTitle>
              <p className="text-sm text-gray-500">
                Significant shifts in your identity graph
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakthroughs.map(breakthrough => {
                  const impactConf = impactConfig[breakthrough.impact];

                  return (
                    <button
                      key={breakthrough.id}
                      onClick={() => onViewBreakthrough?.(breakthrough.id)}
                      className={`w-full p-4 rounded-lg border-2 ${impactConf.color} hover:shadow-md transition-all text-left`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${impactConf.color} border-0`}>
                          {impactConf.label}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {new Date(breakthrough.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-3">
                        {breakthrough.description}
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{breakthrough.nodesAffected}</p>
                          <p className="text-xs text-gray-500">Nodes Affected</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-600">{breakthrough.tensionsResolved}</p>
                          <p className="text-xs text-gray-500">Tensions Resolved</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">{breakthrough.newPatternsEmerged}</p>
                          <p className="text-xs text-gray-500">New Patterns</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Regressions */}
          {regressions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Temporary Regressions
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Challenging periods and recovery
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {regressions.map(regression => (
                    <div
                      key={regression.id}
                      className={`p-3 rounded-lg border ${
                        regression.recovered ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {regression.recovered ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Activity className="h-4 w-4 text-amber-600" />
                          )}
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {regression.regressionType.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(regression.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`${
                          regression.severity >= 4 ? 'text-red-600' : regression.severity >= 2 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          Severity: {regression.severity}/5
                        </span>
                        {regression.recovered && regression.recoveryDays && (
                          <span className="text-emerald-600">
                            Recovered in {regression.recoveryDays}d
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Your Growth Journey:</strong> This report shows how your identity graph
            has evolved. It's not about judgment - growth isn't linear and regressions are
            part of learning. Use this to understand your patterns and celebrate progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <EvolutionReport
 *   startDate="2024-01-01"
 *   endDate="2024-12-31"
 *   nodeEvolution={[
 *     { nodeType: 'belief', created: 12, strengthened: 8, weakened: 4, dissolved: 2 },
 *     { nodeType: 'emotion', created: 18, strengthened: 15, weakened: 6, dissolved: 3 }
 *   ]}
 *   tensionTrends={[
 *     { period: 'Q1', emerged: 15, resolved: 8, avgDuration: 23, avgEnergy: 0.72 },
 *     { period: 'Q2', emerged: 12, resolved: 14, avgDuration: 18, avgEnergy: 0.65 }
 *   ]}
 *   patternLifecycles={[
 *     {
 *       id: 'pat_1',
 *       patternType: 'tension',
 *       label: 'Work-life balance struggle',
 *       emergedDate: '2024-01-15',
 *       resolvedDate: '2024-04-20',
 *       duration: 95,
 *       peakIntensity: 0.87,
 *       outcome: 'resolved'
 *     }
 *   ]}
 *   breakthroughs={[
 *     {
 *       id: 'bt_1',
 *       date: '2024-06-15',
 *       description: 'Realized I can set boundaries without guilt',
 *       impact: 'major',
 *       nodesAffected: 12,
 *       tensionsResolved: 3,
 *       newPatternsEmerged: 2
 *     }
 *   ]}
 *   regressions={[
 *     {
 *       id: 'reg_1',
 *       date: '2024-03-10',
 *       regressionType: 'self_attack',
 *       severity: 3,
 *       recovered: true,
 *       recoveryDays: 14
 *     }
 *   ]}
 *   growthMetrics={[
 *     {
 *       period: 'Q1',
 *       overallGrowth: 0.15,
 *       nodeComplexity: 0.62,
 *       tensionManagement: 0.58,
 *       emotionalRange: 0.71,
 *       integrationCapacity: 0.54
 *     }
 *   ]}
 *   onViewPattern={(id) => console.log('View pattern:', id)}
 *   onViewBreakthrough={(id) => console.log('View breakthrough:', id)}
 * />
 */
