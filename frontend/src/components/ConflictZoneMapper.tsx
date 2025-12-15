import React, { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  TrendingUp,
  Filter,
  Eye,
  Target,
  Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * ConflictZoneMapper - High-Tension Cluster Identification
 * 
 * Features:
 * - Identify clusters of high-tension nodes
 * - Visualize conflict zones with intensity
 * - Show interconnected tensions
 * - Filter by tension energy threshold
 * - Cluster analysis (size, average energy, dominant lens)
 * - Recommended intervention actions
 * 
 * Constitutional Note: Conflict zones aren't "bad" - they're areas of active
 * growth and change. This tool helps you understand where your mind is working
 * hardest to integrate competing ideas.
 */

type NodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';

interface ConflictNode {
  id: string;
  label: string;
  nodeType: NodeType;
  strength: number;
  activationCount: number;
}

interface TensionConnection {
  id: string;
  nodeA: string;
  nodeB: string;
  energy: number;
  duration: number; // days
  lensContext: string[];
}

interface ConflictZone {
  id: string;
  name: string;
  description: string;
  nodes: ConflictNode[];
  tensions: TensionConnection[];
  metrics: {
    totalEnergy: number;
    avgEnergy: number;
    peakEnergy: number;
    avgDuration: number;
    nodeCount: number;
    tensionCount: number;
    dominantLens: string;
    dominantNodeType: NodeType;
  };
  interventionSuggestions: string[];
}

interface ConflictZoneMapperProps {
  zones: ConflictZone[];
  onViewNode?: (nodeId: string) => void;
  onViewTension?: (tensionId: string) => void;
  onExploreZone?: (zoneId: string) => void;
}

const nodeTypeColors: Record<NodeType, string> = {
  thought: 'bg-blue-100 text-blue-700',
  belief: 'bg-purple-100 text-purple-700',
  emotion: 'bg-pink-100 text-pink-700',
  action: 'bg-emerald-100 text-emerald-700',
  experience: 'bg-amber-100 text-amber-700',
  consequence: 'bg-red-100 text-red-700'
};

const getEnergyColor = (energy: number): string => {
  if (energy >= 0.8) return 'text-red-600 bg-red-50 border-red-200';
  if (energy >= 0.6) return 'text-orange-600 bg-orange-50 border-orange-200';
  if (energy >= 0.4) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-yellow-600 bg-yellow-50 border-yellow-200';
};

const getEnergyBadge = (energy: number): { label: string; color: string } => {
  if (energy >= 0.8) return { label: 'Critical', color: 'bg-red-600 text-white' };
  if (energy >= 0.6) return { label: 'High', color: 'bg-orange-600 text-white' };
  if (energy >= 0.4) return { label: 'Medium', color: 'bg-amber-600 text-white' };
  return { label: 'Low', color: 'bg-yellow-600 text-white' };
};

export function ConflictZoneMapper({
  zones,
  onViewNode,
  onViewTension,
  onExploreZone
}: ConflictZoneMapperProps) {
  const [energyThreshold, setEnergyThreshold] = useState<number>(0.4);
  const [sortBy, setSortBy] = useState<'energy' | 'size' | 'duration'>('energy');
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  // Filter zones by energy threshold
  const filteredZones = zones
    .filter(zone => zone.metrics.avgEnergy >= energyThreshold)
    .sort((a, b) => {
      switch (sortBy) {
        case 'energy':
          return b.metrics.avgEnergy - a.metrics.avgEnergy;
        case 'size':
          return b.metrics.nodeCount - a.metrics.nodeCount;
        case 'duration':
          return b.metrics.avgDuration - a.metrics.avgDuration;
        default:
          return 0;
      }
    });

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }
      return next;
    });
  };

  const totalConflictEnergy = zones.reduce((sum, zone) => sum + zone.metrics.totalEnergy, 0);
  const avgConflictEnergy = zones.length > 0 ? totalConflictEnergy / zones.length : 0;
  const criticalZones = zones.filter(z => z.metrics.avgEnergy >= 0.8).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-orange-600" />
          Conflict Zone Mapper
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          High-tension clusters where competing ideas are active
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Zones</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{zones.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical Zones</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{criticalZones}</p>
              </div>
              <Flame className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Energy</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {totalConflictEnergy.toFixed(1)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Energy</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {(avgConflictEnergy * 100).toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Energy Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Energy Threshold
              </label>
              <span className="text-sm font-medium text-gray-900">
                {(energyThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={energyThreshold}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEnergyThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sort By</p>
            <div className="flex gap-2">
              {(['energy', 'size', 'duration'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                    sortBy === option
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Zones List */}
      <div className="space-y-4">
        {filteredZones.length > 0 ? (
          filteredZones.map(zone => {
            const isExpanded = expandedZones.has(zone.id);
            const energyBadge = getEnergyBadge(zone.metrics.avgEnergy);

            return (
              <Card
                key={zone.id}
                className={`border-2 ${getEnergyColor(zone.metrics.avgEnergy)} cursor-pointer hover:shadow-lg transition-shadow`}
                onClick={() => toggleZone(zone.id)}
              >
                <CardContent className="pt-6">
                  {/* Zone Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{zone.name}</h3>
                        <Badge className={`${energyBadge.color} border-0`}>
                          {energyBadge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{zone.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">
                        {(zone.metrics.avgEnergy * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">Avg Energy</p>
                    </div>
                  </div>

                  {/* Zone Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white bg-opacity-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Nodes</p>
                      <p className="text-lg font-bold text-gray-900">{zone.metrics.nodeCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tensions</p>
                      <p className="text-lg font-bold text-gray-900">{zone.metrics.tensionCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Avg Duration</p>
                      <p className="text-lg font-bold text-gray-900">{zone.metrics.avgDuration.toFixed(0)}d</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dominant Lens</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">{zone.metrics.dominantLens}</p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-300 space-y-4">
                      {/* Nodes in Zone */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Nodes in This Zone ({zone.nodes.length})
                        </h4>
                        <div className="grid gap-2">
                          {zone.nodes.slice(0, 5).map(node => (
                            <button
                              key={node.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewNode?.(node.id);
                              }}
                              className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={`${nodeTypeColors[node.nodeType]} border-0 text-xs`}>
                                    {node.nodeType}
                                  </Badge>
                                  <p className="text-sm font-medium text-gray-900">{node.label}</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Strength: {(node.strength * 100).toFixed(0)}%
                                </p>
                              </div>
                            </button>
                          ))}
                          {zone.nodes.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">
                              + {zone.nodes.length - 5} more nodes
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Top Tensions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Top Tensions
                        </h4>
                        <div className="space-y-2">
                          {zone.tensions
                            .sort((a, b) => b.energy - a.energy)
                            .slice(0, 3)
                            .map(tension => {
                              const nodeA = zone.nodes.find(n => n.id === tension.nodeA);
                              const nodeB = zone.nodes.find(n => n.id === tension.nodeB);
                              
                              return (
                                <button
                                  key={tension.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewTension?.(tension.id);
                                  }}
                                  className="w-full p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {nodeA?.label || tension.nodeA} ⚡ {nodeB?.label || tension.nodeB}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {tension.lensContext.map((lens, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {lens}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-orange-600">
                                        {(tension.energy * 100).toFixed(0)}%
                                      </p>
                                      <p className="text-xs text-gray-500">{tension.duration}d</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Intervention Suggestions */}
                      {zone.interventionSuggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Possible Actions</h4>
                          <div className="space-y-2">
                            {zone.interventionSuggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                              >
                                <p className="text-sm text-blue-900">{suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explore Zone Action */}
                      {onExploreZone && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExploreZone(zone.id);
                          }}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Explore This Zone in Graph View
                        </Button>
                      )}
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
                No conflict zones match the current threshold
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Growth Through Tension:</strong> Conflict zones aren't "bad" - they're where
            your mind is actively working to integrate competing ideas. High tension often precedes
            breakthrough insights. This tool helps you see where growth is happening.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <ConflictZoneMapper
 *   zones={[
 *     {
 *       id: 'zone_1',
 *       name: 'Work-Life Balance Cluster',
 *       description: 'Tensions between career ambition and personal wellbeing',
 *       nodes: [
 *         { id: 'node_1', label: 'Must succeed professionally', nodeType: 'belief', strength: 0.85, activationCount: 45 },
 *         { id: 'node_2', label: 'Need more rest', nodeType: 'emotion', strength: 0.72, activationCount: 38 }
 *       ],
 *       tensions: [
 *         {
 *           id: 'tension_1',
 *           nodeA: 'node_1',
 *           nodeB: 'node_2',
 *           energy: 0.87,
 *           duration: 23,
 *           lensContext: ['work', 'health']
 *         }
 *       ],
 *       metrics: {
 *         totalEnergy: 2.45,
 *         avgEnergy: 0.82,
 *         peakEnergy: 0.91,
 *         avgDuration: 18.5,
 *         nodeCount: 7,
 *         tensionCount: 3,
 *         dominantLens: 'work',
 *         dominantNodeType: 'belief'
 *       },
 *       interventionSuggestions: [
 *         'Explore what "success" means in both domains',
 *         'Reflect on times when both needs were met'
 *       ]
 *     }
 *   ]}
 *   onViewNode={(id) => console.log('View node:', id)}
 *   onViewTension={(id) => console.log('View tension:', id)}
 *   onExploreZone={(id) => console.log('Explore zone:', id)}
 * />
 */

