import React from 'react';
import {
  Activity,
  Zap,
  Clock,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * EngineMetrics - MirrorX Performance Dashboard
 * 
 * Features:
 * - Engine mode indicator (local_llm/remote_llm/manual)
 * - Average response time tracking
 * - Constitutional flags history
 * - Patterns surfaced count
 * - Safety interventions log
 * - Performance trends over time
 * 
 * Constitutional Note: Engine metrics ensure accountability—
 * you can see how the AI is performing and flag issues.
 */

export type EngineMode = 'local_llm' | 'remote_llm' | 'manual' | 'offline';

interface ConstitutionalFlag {
  id: string;
  type: 'bias_detected' | 'safety_concern' | 'pattern_mismatch' | 'low_confidence';
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

interface PatternSummary {
  type: string;
  count: number;
  lastDetected: string;
}

interface PerformanceMetric {
  date: string;
  avgResponseTime: number; // ms
  requestCount: number;
}

interface EngineMetricsData {
  mode: EngineMode;
  uptime: number; // seconds
  avgResponseTime: number; // ms
  totalRequests: number;
  constitutionalFlags: ConstitutionalFlag[];
  patternsSurfaced: PatternSummary[];
  safetyInterventions: number;
  performanceHistory: PerformanceMetric[];
}

interface EngineMetricsProps {
  data: EngineMetricsData;
  onViewFlag?: (flagId: string) => void;
  onViewPattern?: (patternType: string) => void;
}

// Mode metadata
const modeStyles = {
  local_llm: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Local LLM', icon: Server },
  remote_llm: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Remote LLM', icon: Zap },
  manual: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Manual', icon: Activity },
  offline: { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Offline', icon: AlertTriangle }
};

// Flag type colors
const flagColors = {
  bias_detected: 'bg-yellow-100 text-yellow-700',
  safety_concern: 'bg-red-100 text-red-700',
  pattern_mismatch: 'bg-orange-100 text-orange-700',
  low_confidence: 'bg-blue-100 text-blue-700'
};

// Severity colors
const severityColors = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-orange-200 text-orange-700',
  high: 'bg-red-200 text-red-700'
};

export function EngineMetrics({
  data,
  onViewFlag,
  onViewPattern
}: EngineMetricsProps) {
  const modeStyle = modeStyles[data.mode];
  const ModeIcon = modeStyle.icon;

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const unresolvedFlags = data.constitutionalFlags.filter(f => !f.resolved);
  const highSeverityFlags = unresolvedFlags.filter(f => f.severity === 'high');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-7 w-7 text-purple-600" />
          Engine Performance
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          MirrorX intelligence engine metrics and accountability
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Engine Mode</p>
                <Badge className={`${modeStyle.bg} ${modeStyle.color} border-0 mt-2`}>
                  <ModeIcon className="h-3 w-3 mr-1" />
                  {modeStyle.label}
                </Badge>
              </div>
              <ModeIcon className={`h-8 w-8 ${modeStyle.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatUptime(data.uptime)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.avgResponseTime}ms
                </p>
              </div>
              <Zap className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.totalRequests.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(highSeverityFlags.length > 0 || data.safetyInterventions > 0) && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highSeverityFlags.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">
                  {highSeverityFlags.length} High-Severity Constitutional Flag{highSeverityFlags.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  These require immediate review to ensure system alignment
                </p>
              </div>
            )}
            {data.safetyInterventions > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900">
                  {data.safetyInterventions} Safety Intervention{data.safetyInterventions > 1 ? 's' : ''} Today
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  View safety event log for details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Response Time Trends</CardTitle>
          <p className="text-sm text-gray-500">
            Average response time over the last 7 days
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                style={{ fontSize: '12px' }}
              />
              <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} style={{ fontSize: '12px' }} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => [`${value}ms`, 'Response Time']}
              />
              <Line
                type="monotone"
                dataKey="avgResponseTime"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Constitutional Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Constitutional Flags
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Issues detected in AI behavior
              </p>
            </div>
            <Badge variant="outline">
              {unresolvedFlags.length} unresolved
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.constitutionalFlags.length > 0 ? (
            <div className="space-y-2">
              {data.constitutionalFlags.slice(0, 5).map((flag) => (
                <button
                  key={flag.id}
                  onClick={() => onViewFlag?.(flag.id)}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-3">
                    {flag.resolved ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <div>
                      <Badge className={`${flagColors[flag.type]} border-0 text-xs mb-1`}>
                        {flag.type.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {new Date(flag.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${severityColors[flag.severity]} border-0 text-xs`}>
                      {flag.severity}
                    </Badge>
                    {flag.resolved && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                        Resolved
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No constitutional flags logged</p>
          )}
        </CardContent>
      </Card>

      {/* Patterns Surfaced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Patterns Surfaced
          </CardTitle>
          <p className="text-sm text-gray-500">
            Identity patterns detected by the engine
          </p>
        </CardHeader>
        <CardContent>
          {data.patternsSurfaced.length > 0 ? (
            <div className="space-y-2">
              {data.patternsSurfaced.map((pattern, index) => (
                <button
                  key={index}
                  onClick={() => onViewPattern?.(pattern.type)}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-left">{pattern.type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last detected: {new Date(pattern.lastDetected).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {pattern.count} times
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No patterns detected yet</p>
          )}
        </CardContent>
      </Card>

      {/* Request Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Volume</CardTitle>
          <p className="text-sm text-gray-500">
            Number of requests over the last 7 days
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                style={{ fontSize: '12px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => [value, 'Requests']}
              />
              <Bar dataKey="requestCount" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Engine accountability:</strong> These metrics exist to ensure the AI operates 
            within constitutional bounds. If you see concerning patterns or flags, you can report 
            them to improve the system. Performance data never leaves your instance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <EngineMetrics
 *   data={{
 *     mode: 'local_llm',
 *     uptime: 86400,
 *     avgResponseTime: 234,
 *     totalRequests: 1523,
 *     constitutionalFlags: [
 *       {
 *         id: 'flag_1',
 *         type: 'low_confidence',
 *         timestamp: '2024-01-15T10:00:00Z',
 *         severity: 'medium',
 *         resolved: false
 *       }
 *     ],
 *     patternsSurfaced: [
 *       {
 *         type: 'Avoidance Pattern',
 *         count: 12,
 *         lastDetected: '2024-01-15T10:00:00Z'
 *       }
 *     ],
 *     safetyInterventions: 2,
 *     performanceHistory: [
 *       { date: '2024-01-09', avgResponseTime: 245, requestCount: 120 },
 *       { date: '2024-01-10', avgResponseTime: 230, requestCount: 145 }
 *     ]
 *   }}
 *   onViewFlag={(id) => console.log('View flag:', id)}
 *   onViewPattern={(type) => console.log('View pattern:', type)}
 * />
 */
