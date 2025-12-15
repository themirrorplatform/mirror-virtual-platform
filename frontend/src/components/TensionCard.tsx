import React from 'react';
import { Zap, TrendingUp, Calendar, Tag, ExternalLink, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { NodeType } from './IdentityGraphView';

/**
 * TensionCard - Tension Display Component
 * 
 * Features:
 * - Display tension between two nodes
 * - Energy indicator (0.0 - 1.0) with visual gauge
 * - Duration in days since tension emerged
 * - Lens tags that surfaced this tension
 * - "Explore this tension" action to dive deeper
 * 
 * Constitutional Note: Tensions are not problems to solve—
 * they're information about where growth might happen.
 */

interface TensionNode {
  id: string;
  label: string;
  nodeType: NodeType;
}

interface Tension {
  id: string;
  sourceNode: TensionNode;
  targetNode: TensionNode;
  energy: number; // 0.0 - 1.0
  duration: number; // days
  lensTags: string[];
  firstDetected: string;
  lastActivated: string;
  description?: string;
}

interface TensionCardProps {
  tension: Tension;
  onExplore?: (tensionId: string) => void;
  onViewNode?: (nodeId: string) => void;
}

// Energy level thresholds and colors
const getEnergyLevel = (energy: number): { label: string; color: string; bgColor: string } => {
  if (energy >= 0.7) return { label: 'High', color: 'text-red-700', bgColor: 'bg-red-100' };
  if (energy >= 0.4) return { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-100' };
  return { label: 'Low', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
};

// Node type colors (matching IdentityGraphView)
const nodeColors: Record<NodeType, string> = {
  thought: 'bg-sky-100 text-sky-700',
  belief: 'bg-pink-100 text-pink-700',
  emotion: 'bg-amber-100 text-amber-700',
  action: 'bg-emerald-100 text-emerald-700',
  experience: 'bg-purple-100 text-purple-700',
  consequence: 'bg-orange-100 text-orange-700'
};

export function TensionCard({
  tension,
  onExplore,
  onViewNode
}: TensionCardProps) {
  const energyLevel = getEnergyLevel(tension.energy);

  // Format duration
  const getDurationText = () => {
    if (tension.duration < 1) return 'Less than a day';
    if (tension.duration === 1) return '1 day';
    if (tension.duration < 7) return `${tension.duration} days`;
    if (tension.duration < 30) {
      const weeks = Math.floor(tension.duration / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }
    const months = Math.floor(tension.duration / 30);
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Tension
          </CardTitle>
          <Badge className={`${energyLevel.bgColor} ${energyLevel.color} border-0`}>
            {energyLevel.label} Energy
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nodes in Tension */}
        <div className="space-y-3">
          <button
            onClick={() => onViewNode?.(tension.sourceNode.id)}
            className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Badge className={nodeColors[tension.sourceNode.nodeType]}>
                {tension.sourceNode.nodeType}
              </Badge>
              <span className="font-medium text-left">{tension.sourceNode.label}</span>
            </div>
            {onViewNode && (
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-purple-600">
              <div className="h-px w-8 bg-purple-300" />
              <Zap className="h-5 w-5" />
              <div className="h-px w-8 bg-purple-300" />
            </div>
          </div>

          <button
            onClick={() => onViewNode?.(tension.targetNode.id)}
            className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Badge className={nodeColors[tension.targetNode.nodeType]}>
                {tension.targetNode.nodeType}
              </Badge>
              <span className="font-medium text-left">{tension.targetNode.label}</span>
            </div>
            {onViewNode && (
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Description */}
        {tension.description && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-900">{tension.description}</p>
          </div>
        )}

        {/* Energy Gauge */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Tension Energy</span>
            <span className={`font-medium ${energyLevel.color}`}>
              {(tension.energy * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                tension.energy >= 0.7
                  ? 'bg-red-500'
                  : tension.energy >= 0.4
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${tension.energy * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher energy = more active in recent reflections
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-medium">{getDurationText()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Last Active</p>
              <p className="font-medium">
                {new Date(tension.lastActivated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Lens Tags */}
        {tension.lensTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Detected By Lenses</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tension.lensTags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Explore Action */}
        {onExplore && (
          <Button
            onClick={() => onExplore(tension.id)}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <TrendingUp className="h-4 w-4" />
            Explore This Tension
          </Button>
        )}

        {/* Constitutional Note */}
        <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
          <strong>Tensions aren't problems:</strong> They're places where your beliefs, 
          emotions, or behaviors pull in different directions. Exploring them can reveal 
          growth opportunities—but you're never obligated to "resolve" them.
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * <TensionCard
 *   tension={{
 *     id: 'tension_123',
 *     sourceNode: {
 *       id: 'node_1',
 *       label: 'Want deep connection',
 *       nodeType: 'emotion'
 *     },
 *     targetNode: {
 *       id: 'node_2',
 *       label: 'Fear of vulnerability',
 *       nodeType: 'emotion'
 *     },
 *     energy: 0.78,
 *     duration: 45,
 *     lensTags: ['relationships', 'emotions', 'boundaries'],
 *     firstDetected: '2024-01-01T00:00:00Z',
 *     lastActivated: '2024-01-15T10:00:00Z',
 *     description: 'Conflicting desires around intimacy and self-protection'
 *   }}
 *   onExplore={(id) => console.log('Explore tension:', id)}
 *   onViewNode={(id) => console.log('View node:', id)}
 * />
 */
