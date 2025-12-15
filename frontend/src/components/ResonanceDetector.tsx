import React, { useState } from 'react';
import {
  Radio,
  Users,
  Eye,
  TrendingUp,
  Sparkles,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * ResonanceDetector - Pattern Similarity Across Users
 * 
 * Features:
 * - Detect similar patterns in other users (anonymized)
 * - Show resonance strength (0-1 similarity score)
 * - Compare pattern evolution trajectories
 * - Suggest potential mirrors based on resonance
 * - Filter by pattern type and resonance strength
 * - Privacy-preserving: only aggregated, anonymized data
 * 
 * Constitutional Note: This NEVER shows individual user data.
 * All comparisons are anonymized and aggregated. You're seeing
 * patterns, not people. No surveillance, only resonance.
 */

type PatternType = 'tension' | 'loop' | 'transformation' | 'integration' | 'emergence';
type NodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';

interface ResonantPattern {
  id: string;
  patternType: PatternType;
  description: string;
  yourNodes: string[];
  resonanceScore: number; // 0-1 similarity to others
  userCount: number; // how many others have similar pattern
  avgOutcome: 'positive' | 'neutral' | 'negative' | 'mixed';
  commonNextSteps: string[];
  lensContext: string[];
  dominantNodeType: NodeType;
  metrics: {
    avgDuration: number; // days
    avgTensionEnergy: number;
    resolutionRate: number; // percentage that resolved
  };
}

interface SuggestedMirror {
  instanceId: string; // anonymized
  resonanceScore: number;
  sharedPatterns: number;
  complementaryPatterns: number;
  lensOverlap: string[];
  growthTrajectory: 'parallel' | 'complementary' | 'divergent';
  potentialValue: string;
}

interface ResonanceDetectorProps {
  patterns: ResonantPattern[];
  suggestedMirrors: SuggestedMirror[];
  onExplorePattern?: (patternId: string) => void;
  onConnectToMirror?: (instanceId: string) => void;
}

const patternTypeConfig: Record<PatternType, { color: string; label: string; icon: React.ElementType }> = {
  tension: { color: 'bg-amber-100 text-amber-700 border-amber-300', label: 'Tension', icon: Radio },
  loop: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Recurring Loop', icon: Radio },
  transformation: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Transformation', icon: Sparkles },
  integration: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Integration', icon: TrendingUp },
  emergence: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: 'Emergence', icon: Sparkles }
};

const outcomeConfig = {
  positive: { color: 'bg-green-600 text-white', label: 'Generally Positive' },
  neutral: { color: 'bg-gray-600 text-white', label: 'Neutral' },
  negative: { color: 'bg-red-600 text-white', label: 'Often Challenging' },
  mixed: { color: 'bg-amber-600 text-white', label: 'Mixed Results' }
};

const trajectoryConfig = {
  parallel: { color: 'bg-blue-100 text-blue-700', label: 'Parallel Growth', desc: 'Similar development paths' },
  complementary: { color: 'bg-purple-100 text-purple-700', label: 'Complementary', desc: 'Different strengths that balance' },
  divergent: { color: 'bg-amber-100 text-amber-700', label: 'Divergent', desc: 'Contrasting perspectives' }
};

const nodeTypeColors: Record<NodeType, string> = {
  thought: 'bg-blue-100 text-blue-700',
  belief: 'bg-purple-100 text-purple-700',
  emotion: 'bg-pink-100 text-pink-700',
  action: 'bg-emerald-100 text-emerald-700',
  experience: 'bg-amber-100 text-amber-700',
  consequence: 'bg-red-100 text-red-700'
};

export function ResonanceDetector({
  patterns,
  suggestedMirrors,
  onExplorePattern,
  onConnectToMirror
}: ResonanceDetectorProps) {
  const [minResonance, setMinResonance] = useState<number>(0.6);
  const [selectedPatternType, setSelectedPatternType] = useState<PatternType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'patterns' | 'mirrors'>('patterns');

  // Filter patterns
  const filteredPatterns = patterns
    .filter(p => p.resonanceScore >= minResonance)
    .filter(p => selectedPatternType === 'all' || p.patternType === selectedPatternType)
    .sort((a, b) => b.resonanceScore - a.resonanceScore);

  // Sort mirrors by resonance
  const sortedMirrors = [...suggestedMirrors].sort((a, b) => b.resonanceScore - a.resonanceScore);

  const highResonancePatterns = patterns.filter(p => p.resonanceScore >= 0.8).length;
  const totalUsers = patterns.reduce((sum, p) => sum + p.userCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Radio className="h-7 w-7 text-blue-600" />
          Resonance Detector
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pattern similarities across the network (fully anonymized)
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Patterns</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{patterns.length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Resonance</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{highResonancePatterns}</p>
              </div>
              <Radio className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Network Size</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('patterns')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'patterns'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Resonant Patterns
        </button>
        <button
          onClick={() => setViewMode('mirrors')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'mirrors'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Suggested Mirrors ({suggestedMirrors.length})
        </button>
      </div>

      {/* Patterns View */}
      {viewMode === 'patterns' && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Resonance Threshold */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Minimum Resonance
                  </label>
                  <span className="text-sm font-medium text-gray-900">
                    {(minResonance * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={minResonance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMinResonance(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Pattern Type Filter */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Pattern Type</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedPatternType('all')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      selectedPatternType === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Types
                  </button>
                  {(Object.keys(patternTypeConfig) as PatternType[]).map(type => {
                    const config = patternTypeConfig[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedPatternType(type)}
                        className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                          selectedPatternType === type
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
            </CardContent>
          </Card>

          {/* Patterns List */}
          <div className="space-y-4">
            {filteredPatterns.length > 0 ? (
              filteredPatterns.map(pattern => {
                const typeConfig = patternTypeConfig[pattern.patternType];
                const TypeIcon = typeConfig.icon;
                const outcomeConf = outcomeConfig[pattern.avgOutcome];

                return (
                  <Card key={pattern.id} className={`border-2 ${typeConfig.color}`}>
                    <CardContent className="pt-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <TypeIcon className="h-5 w-5" />
                            <Badge className={`${typeConfig.color} border-0`}>
                              {typeConfig.label}
                            </Badge>
                            <Badge className={`${outcomeConf.color} border-0`}>
                              {outcomeConf.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{pattern.description}</p>
                          <p className="text-xs text-gray-500">
                            {pattern.userCount} others have similar patterns
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-600">
                            {(pattern.resonanceScore * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">Resonance</p>
                        </div>
                      </div>

                      {/* Resonance Bar */}
                      <div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${pattern.resonanceScore * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg text-center">
                        <div>
                          <p className="text-xs text-gray-500">Avg Duration</p>
                          <p className="text-sm font-bold text-gray-900">{pattern.metrics.avgDuration}d</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Avg Tension</p>
                          <p className="text-sm font-bold text-gray-900">
                            {(pattern.metrics.avgTensionEnergy * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Resolution Rate</p>
                          <p className="text-sm font-bold text-gray-900">
                            {(pattern.metrics.resolutionRate * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Your Nodes */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Your nodes in this pattern:</p>
                        <div className="flex flex-wrap gap-1">
                          {pattern.yourNodes.map((node, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {node}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Common Next Steps */}
                      {pattern.commonNextSteps.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-2">
                            Common next steps from others:
                          </p>
                          <ul className="space-y-1">
                            {pattern.commonNextSteps.map((step, idx) => (
                              <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                                <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Lens Context */}
                      {pattern.lensContext.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pattern.lensContext.map((lens, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {lens}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Explore Action */}
                      {onExplorePattern && (
                        <Button
                          onClick={() => onExplorePattern(pattern.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Explore This Pattern
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 text-center italic">
                    No patterns match the current filters
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Mirrors View */}
      {viewMode === 'mirrors' && (
        <div className="space-y-4">
          {sortedMirrors.length > 0 ? (
            sortedMirrors.map(mirror => {
              const trajConfig = trajectoryConfig[mirror.growthTrajectory];

              return (
                <Card key={mirror.instanceId} className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          <Badge variant="outline" className="text-xs font-mono">
                            Instance: {mirror.instanceId.slice(0, 12)}...
                          </Badge>
                        </div>
                        <Badge className={`${trajConfig.color} border-0 mb-2`}>
                          {trajConfig.label}
                        </Badge>
                        <p className="text-xs text-gray-600">{trajConfig.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-600">
                          {(mirror.resonanceScore * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">Resonance</p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-purple-50 rounded-lg text-center">
                      <div>
                        <p className="text-xs text-purple-600">Shared Patterns</p>
                        <p className="text-lg font-bold text-purple-900">{mirror.sharedPatterns}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-600">Complementary</p>
                        <p className="text-lg font-bold text-purple-900">{mirror.complementaryPatterns}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-600">Lens Overlap</p>
                        <p className="text-lg font-bold text-purple-900">{mirror.lensOverlap.length}</p>
                      </div>
                    </div>

                    {/* Potential Value */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 mb-1">Potential Value:</p>
                      <p className="text-sm text-blue-800">{mirror.potentialValue}</p>
                    </div>

                    {/* Lens Overlap */}
                    {mirror.lensOverlap.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Shared lenses:</p>
                        <div className="flex flex-wrap gap-1">
                          {mirror.lensOverlap.map((lens, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {lens}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Connect Action */}
                    {onConnectToMirror && (
                      <Button
                        onClick={() => onConnectToMirror(mirror.instanceId)}
                        className="w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Request Connection
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500 text-center italic">
                  No mirror suggestions available yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Privacy First:</strong> This detector NEVER shows individual user data.
            All comparisons are fully anonymized and aggregated. You're seeing patterns across
            the network, not looking at specific people. No surveillance - only resonance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <ResonanceDetector
 *   patterns={[
 *     {
 *       id: 'pattern_1',
 *       patternType: 'tension',
 *       description: 'Work ambition vs. personal wellbeing',
 *       yourNodes: ['belief_123', 'emotion_456'],
 *       resonanceScore: 0.87,
 *       userCount: 143,
 *       avgOutcome: 'mixed',
 *       commonNextSteps: [
 *         'Set explicit boundaries around work hours',
 *         'Explore what "success" means personally'
 *       ],
 *       lensContext: ['work', 'health', 'identity'],
 *       dominantNodeType: 'belief',
 *       metrics: {
 *         avgDuration: 45,
 *         avgTensionEnergy: 0.75,
 *         resolutionRate: 0.62
 *       }
 *     }
 *   ]}
 *   suggestedMirrors={[
 *     {
 *       instanceId: 'anon_abc123def456',
 *       resonanceScore: 0.82,
 *       sharedPatterns: 5,
 *       complementaryPatterns: 3,
 *       lensOverlap: ['work', 'relationships', 'identity'],
 *       growthTrajectory: 'parallel',
 *       potentialValue: 'Similar growth path with different approaches to work-life balance'
 *     }
 *   ]}
 *   onExplorePattern={(id) => console.log('Explore pattern:', id)}
 *   onConnectToMirror={(id) => console.log('Connect to:', id)}
 * />
 */

