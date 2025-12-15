import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Activity,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * BoundaryMonitor - Healthy vs Unhealthy Boundary Tracking
 * 
 * Features:
 * - Track boundary violations and affirmations
 * - Visualize boundary health over time
 * - Identify patterns of healthy/unhealthy boundaries
 * - Show lens context for boundary events
 * - Alert on repeated violations
 * - Celebrate boundary affirmations
 * - Trend analysis for boundary strength
 * 
 * Constitutional Note: Boundaries are essential for healthy identity.
 * This tool helps you see patterns in how you protect or compromise
 * your values, needs, and limits.
 */

type BoundaryType = 'physical' | 'emotional' | 'time' | 'energy' | 'values' | 'communication';
type BoundaryEventType = 'violation' | 'affirmation' | 'negotiation' | 'unclear';

interface BoundaryEvent {
  id: string;
  timestamp: string;
  boundaryType: BoundaryType;
  eventType: BoundaryEventType;
  description: string;
  nodeId?: string;
  nodeLabel?: string;
  lensContext: string[];
  severity?: number; // 1-5 for violations
  strength?: number; // 1-5 for affirmations
}

interface BoundaryPattern {
  boundaryType: BoundaryType;
  violationCount: number;
  affirmationCount: number;
  health: number; // 0-1 (affirmations / total events)
  trend: 'improving' | 'declining' | 'stable';
  recentEvents: BoundaryEvent[];
  commonContexts: string[];
  recommendations: string[];
}

interface BoundaryHealthData {
  date: string;
  overallHealth: number;
  violations: number;
  affirmations: number;
}

interface BoundaryMonitorProps {
  patterns: BoundaryPattern[];
  healthHistory: BoundaryHealthData[];
  recentEvents: BoundaryEvent[];
  onViewEvent?: (eventId: string) => void;
  onViewNode?: (nodeId: string) => void;
}

const boundaryTypeConfig: Record<BoundaryType, { color: string; icon: React.ElementType; label: string }> = {
  physical: { color: 'bg-red-100 text-red-700', icon: Shield, label: 'Physical' },
  emotional: { color: 'bg-pink-100 text-pink-700', icon: Heart, label: 'Emotional' },
  time: { color: 'bg-blue-100 text-blue-700', icon: Activity, label: 'Time' },
  energy: { color: 'bg-amber-100 text-amber-700', icon: TrendingUp, label: 'Energy' },
  values: { color: 'bg-purple-100 text-purple-700', icon: Shield, label: 'Values' },
  communication: { color: 'bg-emerald-100 text-emerald-700', icon: Eye, label: 'Communication' }
};

const eventTypeConfig: Record<BoundaryEventType, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  violation: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle, label: 'Violation' },
  affirmation: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle, label: 'Affirmation' },
  negotiation: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Activity, label: 'Negotiation' },
  unclear: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: Eye, label: 'Unclear' }
};

const trendConfig = {
  improving: { color: 'text-emerald-600', icon: TrendingUp, label: 'Improving' },
  declining: { color: 'text-red-600', icon: TrendingDown, label: 'Declining' },
  stable: { color: 'text-gray-600', icon: Activity, label: 'Stable' }
};

export function BoundaryMonitor({
  patterns,
  healthHistory,
  recentEvents,
  onViewEvent,
  onViewNode
}: BoundaryMonitorProps) {
  const [selectedBoundaryType, setSelectedBoundaryType] = useState<BoundaryType | 'all'>('all');

  // Calculate overall stats
  const totalViolations = patterns.reduce((sum, p) => sum + p.violationCount, 0);
  const totalAffirmations = patterns.reduce((sum, p) => sum + p.affirmationCount, 0);
  const overallHealth = totalAffirmations + totalViolations > 0
    ? totalAffirmations / (totalAffirmations + totalViolations)
    : 0.5;
  
  const criticalBoundaries = patterns.filter(p => p.health < 0.3).length;

  // Filter patterns
  const filteredPatterns = selectedBoundaryType === 'all'
    ? patterns
    : patterns.filter(p => p.boundaryType === selectedBoundaryType);

  // Filter recent events
  const filteredEvents = selectedBoundaryType === 'all'
    ? recentEvents
    : recentEvents.filter(e => e.boundaryType === selectedBoundaryType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-purple-600" />
          Boundary Monitor
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Track how you protect and honor your boundaries
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Health</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(overallHealth * 100).toFixed(0)}%
                </p>
              </div>
              <Shield className={`h-8 w-8 ${
                overallHealth >= 0.7 ? 'text-emerald-600' : overallHealth >= 0.4 ? 'text-amber-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Affirmations</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{totalAffirmations}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Violations</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{totalViolations}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{criticalBoundaries}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalBoundaries > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 mb-1">Boundary Health Alert</p>
                <p className="text-sm text-red-800">
                  {criticalBoundaries} boundary type{criticalBoundaries > 1 ? 's' : ''} showing concerning patterns.
                  Consider reflection or support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boundary Health Over Time</CardTitle>
          <p className="text-sm text-gray-500">
            30-day trend of boundary affirmations vs violations
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                style={{ fontSize: '12px' }}
              />
              <YAxis domain={[0, 1]} style={{ fontSize: '12px' }} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Health']}
              />
              <Line
                type="monotone"
                dataKey="overallHealth"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Boundary Type Filter */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Filter by Boundary Type</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBoundaryType('all')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectedBoundaryType === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Types
          </button>
          {(Object.keys(boundaryTypeConfig) as BoundaryType[]).map(type => {
            const config = boundaryTypeConfig[type];
            return (
              <button
                key={type}
                onClick={() => setSelectedBoundaryType(type)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  selectedBoundaryType === type
                    ? config.color
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Boundary Patterns */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Boundary Patterns</h3>
        {filteredPatterns.length > 0 ? (
          filteredPatterns.map(pattern => {
            const typeConfig = boundaryTypeConfig[pattern.boundaryType];
            const trendConf = trendConfig[pattern.trend];
            const TypeIcon = typeConfig.icon;
            const TrendIcon = trendConf.icon;

            return (
              <Card
                key={pattern.boundaryType}
                className={`border-2 ${
                  pattern.health >= 0.7 ? 'border-emerald-200' : pattern.health >= 0.4 ? 'border-amber-200' : 'border-red-200'
                }`}
              >
                <CardContent className="pt-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="h-5 w-5" />
                        <Badge className={`${typeConfig.color} border-0`}>
                          {typeConfig.label} Boundaries
                        </Badge>
                        <Badge className={`${trendConf.color} bg-opacity-10 border-0 flex items-center gap-1`}>
                          <TrendIcon className="h-3 w-3" />
                          {trendConf.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        pattern.health >= 0.7 ? 'text-emerald-600' : pattern.health >= 0.4 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {(pattern.health * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">Health</p>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pattern.health >= 0.7 ? 'bg-emerald-500' : pattern.health >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${pattern.health * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{pattern.affirmationCount}</p>
                      <p className="text-xs text-gray-500">Affirmations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{pattern.violationCount}</p>
                      <p className="text-xs text-gray-500">Violations</p>
                    </div>
                  </div>

                  {/* Common Contexts */}
                  {pattern.commonContexts.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Common contexts:</p>
                      <div className="flex flex-wrap gap-1">
                        {pattern.commonContexts.map((context, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {context}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {pattern.recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {pattern.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center italic">
                No boundary patterns for selected type
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events</CardTitle>
          <p className="text-sm text-gray-500">
            Latest boundary interactions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredEvents.length > 0 ? (
              filteredEvents.slice(0, 10).map(event => {
                const eventConfig = eventTypeConfig[event.eventType];
                const EventIcon = eventConfig.icon;
                const typeConfig = boundaryTypeConfig[event.boundaryType];

                return (
                  <button
                    key={event.id}
                    onClick={() => onViewEvent?.(event.id)}
                    className={`w-full p-3 rounded-lg border ${eventConfig.bg} hover:shadow-md transition-all text-left`}
                  >
                    <div className="flex items-start gap-3">
                      <EventIcon className={`h-5 w-5 ${eventConfig.color} mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${typeConfig.color} border-0 text-xs`}>
                            {typeConfig.label}
                          </Badge>
                          <Badge className={`${eventConfig.color} bg-opacity-10 border-0 text-xs`}>
                            {eventConfig.label}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">{event.description}</p>
                        {event.nodeLabel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              event.nodeId && onViewNode?.(event.nodeId);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Related node: {event.nodeLabel}
                          </button>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.lensContext.map((lens, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {lens}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {event.severity && (
                        <Badge className="bg-red-600 text-white border-0">
                          Severity: {event.severity}/5
                        </Badge>
                      )}
                      {event.strength && (
                        <Badge className="bg-emerald-600 text-white border-0">
                          Strength: {event.strength}/5
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center italic py-4">
                No recent events for selected type
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Boundary Awareness:</strong> Healthy boundaries are essential for wellbeing.
            This monitor helps you see patterns in how you protect your values, needs, and limits.
            There's no judgment - only awareness. Use this data to make intentional choices about
            where you stand firm and where you flex.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <BoundaryMonitor
 *   patterns={[
 *     {
 *       boundaryType: 'time',
 *       violationCount: 8,
 *       affirmationCount: 15,
 *       health: 0.65,
 *       trend: 'improving',
 *       recentEvents: [],
 *       commonContexts: ['work', 'family'],
 *       recommendations: [
 *         'Practice saying no to non-essential commitments',
 *         'Set specific work hours and communicate them clearly'
 *       ]
 *     }
 *   ]}
 *   healthHistory={[
 *     { date: '2024-01-01', overallHealth: 0.55, violations: 5, affirmations: 6 },
 *     { date: '2024-01-08', overallHealth: 0.62, violations: 4, affirmations: 7 }
 *   ]}
 *   recentEvents={[
 *     {
 *       id: 'evt_1',
 *       timestamp: '2024-01-15T10:00:00Z',
 *       boundaryType: 'time',
 *       eventType: 'affirmation',
 *       description: 'Declined extra meeting to protect focus time',
 *       nodeId: 'node_123',
 *       nodeLabel: 'I deserve focused work time',
 *       lensContext: ['work', 'productivity'],
 *       strength: 4
 *     }
 *   ]}
 *   onViewEvent={(id) => console.log('View event:', id)}
 *   onViewNode={(id) => console.log('View node:', id)}
 * />
 */
