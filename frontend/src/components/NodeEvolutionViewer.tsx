import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Zap,
  Minus,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * NodeEvolutionViewer - Single Node Temporal Analysis
 * 
 * Features:
 * - Strength evolution over time (line chart)
 * - Activation history
 * - Connection changes (relationships formed/broken)
 * - Lens context tracking
 * - Related reflections timeline
 * - Statistical summary
 * 
 * Constitutional Note: This shows how a single thought, belief, or emotion
 * has evolved in your mind. It's private introspection data.
 */

type NodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';

interface NodeSnapshot {
  timestamp: string;
  strength: number;
  activationCount: number;
  connectionCount: number;
}

interface ActivationRecord {
  id: string;
  timestamp: string;
  reflectionId?: string;
  reflectionPreview?: string;
  lensContext: string[];
  strengthBefore: number;
  strengthAfter: number;
}

interface ConnectionChange {
  id: string;
  timestamp: string;
  changeType: 'added' | 'removed' | 'strengthened' | 'weakened';
  targetNodeId: string;
  targetNodeLabel: string;
  edgeType: 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';
}

interface NodeEvolutionData {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  content: string;
  createdAt: string;
  currentStrength: number;
  strengthHistory: NodeSnapshot[];
  activations: ActivationRecord[];
  connectionChanges: ConnectionChange[];
  statistics: {
    totalActivations: number;
    avgStrengthChange: number;
    peakStrength: number;
    lowestStrength: number;
    mostCommonLens: string;
    daysTracked: number;
  };
}

interface NodeEvolutionViewerProps {
  data: NodeEvolutionData;
  onViewReflection?: (reflectionId: string) => void;
  onViewRelatedNode?: (nodeId: string) => void;
}

const nodeTypeColors: Record<NodeType, string> = {
  thought: 'bg-blue-100 text-blue-700 border-blue-300',
  belief: 'bg-purple-100 text-purple-700 border-purple-300',
  emotion: 'bg-pink-100 text-pink-700 border-pink-300',
  action: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  experience: 'bg-amber-100 text-amber-700 border-amber-300',
  consequence: 'bg-red-100 text-red-700 border-red-300'
};

const edgeTypeLabels: Record<string, string> = {
  reinforces: '→ Reinforces',
  contradicts: '⚡ Contradicts',
  undermines: '⊥ Undermines',
  leads_to: '⇒ Leads To',
  co_occurs_with: '↔ Co-occurs With'
};

export function NodeEvolutionViewer({
  data,
  onViewReflection,
  onViewRelatedNode
}: NodeEvolutionViewerProps) {
  const [viewMode, setViewMode] = useState<'strength' | 'activations' | 'connections'>('strength');

  const formatStrengthChange = (before: number, after: number): { icon: React.ElementType; color: string; text: string } => {
    const change = after - before;
    if (change > 0.05) {
      return { icon: TrendingUp, color: 'text-emerald-600', text: `+${(change * 100).toFixed(1)}%` };
    } else if (change < -0.05) {
      return { icon: TrendingDown, color: 'text-red-600', text: `${(change * 100).toFixed(1)}%` };
    } else {
      return { icon: Minus, color: 'text-gray-500', text: 'No change' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`border-2 ${nodeTypeColors[data.nodeType]}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${nodeTypeColors[data.nodeType]} border`}>
                  {data.nodeType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  ID: {data.nodeId}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.nodeLabel}</h2>
              <p className="text-sm text-gray-600">{data.content}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{(data.currentStrength * 100).toFixed(0)}%</p>
              <p className="text-xs text-gray-500 mt-1">Current Strength</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tracked For</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {data.statistics.daysTracked} days
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Peak Strength</p>
              <p className="text-sm font-medium text-emerald-600 mt-1">
                {(data.statistics.peakStrength * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lowest Strength</p>
              <p className="text-sm font-medium text-red-600 mt-1">
                {(data.statistics.lowestStrength * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Activations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.statistics.totalActivations}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Strength Change</p>
                <p className={`text-2xl font-bold mt-1 ${
                  data.statistics.avgStrengthChange > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {data.statistics.avgStrengthChange > 0 ? '+' : ''}
                  {(data.statistics.avgStrengthChange * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Most Common Lens</p>
                <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
                  {data.statistics.mostCommonLens}
                </p>
              </div>
              <Eye className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('strength')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'strength'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Strength Over Time
        </button>
        <button
          onClick={() => setViewMode('activations')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'activations'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Activations
        </button>
        <button
          onClick={() => setViewMode('connections')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'connections'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Connection Changes
        </button>
      </div>

      {/* Content Based on View Mode */}
      {viewMode === 'strength' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strength Evolution</CardTitle>
            <p className="text-sm text-gray-500">
              How this node's influence has changed over time
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.strengthHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Strength']}
                />
                <Line
                  type="monotone"
                  dataKey="strength"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {viewMode === 'activations' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activation History</CardTitle>
            <p className="text-sm text-gray-500">
              When and how this node was triggered
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.activations.length > 0 ? (
                data.activations.map(activation => {
                  const strengthChange = formatStrengthChange(activation.strengthBefore, activation.strengthAfter);
                  const ChangeIcon = strengthChange.icon;

                  return (
                    <div
                      key={activation.id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(activation.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChangeIcon className={`h-4 w-4 ${strengthChange.color}`} />
                          <span className={`text-sm font-medium ${strengthChange.color}`}>
                            {strengthChange.text}
                          </span>
                        </div>
                      </div>

                      {activation.reflectionPreview && (
                        <button
                          onClick={() => activation.reflectionId && onViewReflection?.(activation.reflectionId)}
                          className="text-sm text-gray-700 hover:text-gray-900 mb-2 text-left block"
                        >
                          "{activation.reflectionPreview}"
                        </button>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {activation.lensContext.map((lens, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {lens}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center italic py-4">
                  No activation records yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'connections' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection Changes</CardTitle>
            <p className="text-sm text-gray-500">
              How this node's relationships have evolved
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.connectionChanges.length > 0 ? (
                data.connectionChanges.map(change => (
                  <div
                    key={change.id}
                    className={`p-4 rounded-lg border ${
                      change.changeType === 'added' || change.changeType === 'strengthened'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge
                          className={`${
                            change.changeType === 'added' || change.changeType === 'strengthened'
                              ? 'bg-emerald-200 text-emerald-700'
                              : 'bg-red-200 text-red-700'
                          } border-0`}
                        >
                          {change.changeType}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(change.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-gray-700">{edgeTypeLabels[change.edgeType]}</p>
                      <button
                        onClick={() => onViewRelatedNode?.(change.targetNodeId)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {change.targetNodeLabel}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center italic py-4">
                  No connection changes yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Private Evolution Data:</strong> This node evolution view shows how a single
            thought, belief, or emotion has changed in YOUR mind over time. It's private
            introspection data, never shared outside your instance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <NodeEvolutionViewer
 *   data={{
 *     nodeId: 'node_123',
 *     nodeLabel: 'I need external validation',
 *     nodeType: 'belief',
 *     content: 'A persistent belief that I need others to approve of my decisions',
 *     createdAt: '2024-01-01T00:00:00Z',
 *     currentStrength: 0.65,
 *     strengthHistory: [
 *       { timestamp: '2024-01-01', strength: 0.8, activationCount: 1, connectionCount: 2 },
 *       { timestamp: '2024-01-08', strength: 0.75, activationCount: 5, connectionCount: 3 }
 *     ],
 *     activations: [
 *       {
 *         id: 'act_1',
 *         timestamp: '2024-01-15T10:00:00Z',
 *         reflectionId: 'ref_123',
 *         reflectionPreview: 'I felt anxious about the presentation...',
 *         lensContext: ['work', 'identity'],
 *         strengthBefore: 0.7,
 *         strengthAfter: 0.75
 *       }
 *     ],
 *     connectionChanges: [
 *       {
 *         id: 'conn_1',
 *         timestamp: '2024-01-10T14:00:00Z',
 *         changeType: 'added',
 *         targetNodeId: 'node_456',
 *         targetNodeLabel: 'Fear of judgment',
 *         edgeType: 'reinforces'
 *       }
 *     ],
 *     statistics: {
 *       totalActivations: 12,
 *       avgStrengthChange: 0.02,
 *       peakStrength: 0.85,
 *       lowestStrength: 0.55,
 *       mostCommonLens: 'work',
 *       daysTracked: 45
 *     }
 *   }}
 *   onViewReflection={(id) => console.log('View reflection:', id)}
 *   onViewRelatedNode={(id) => console.log('View node:', id)}
 * />
 */
