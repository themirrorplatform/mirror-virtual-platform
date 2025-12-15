import React, { useState } from 'react';
import {
  GitBranch,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Eye,
  Target,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * PathwayExplorer - Potential Growth Paths
 * 
 * Features:
 * - Identify potential development paths from current state
 * - Show branching possibilities based on identity graph
 * - Predict likelihood and impact of each path
 * - Display required steps and estimated duration
 * - Show what nodes would be activated/created
 * - Compare multiple pathways side-by-side
 * 
 * Constitutional Note: These are possibilities, not prescriptions.
 * The AI can't tell you what to do - only show you patterns of how
 * others have grown from similar starting points.
 */

type NodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';

interface PathwayStep {
  order: number;
  description: string;
  estimatedDuration: number; // days
  activatesNodes: string[];
  createsNodes?: {
    label: string;
    nodeType: NodeType;
  }[];
  confidence: number; // 0-1
}

interface PathwayOutcome {
  description: string;
  likelihood: number; // 0-1
  positiveChanges: string[];
  challenges: string[];
}

interface GrowthPathway {
  id: string;
  name: string;
  description: string;
  startingCondition: string;
  targetState: string;
  pathType: 'integration' | 'transformation' | 'reinforcement' | 'release';
  steps: PathwayStep[];
  outcome: PathwayOutcome;
  metrics: {
    totalDuration: number; // days
    avgConfidence: number;
    nodesAffected: number;
    tensionsResolved: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  similarJourneys: number; // how many others took similar paths
  lensContext: string[];
}

interface PathwayExplorerProps {
  pathways: GrowthPathway[];
  currentState?: string;
  onSelectPathway?: (pathwayId: string) => void;
  onViewNode?: (nodeId: string) => void;
}

const pathTypeConfig = {
  integration: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: GitBranch, label: 'Integration' },
  transformation: { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Sparkles, label: 'Transformation' },
  reinforcement: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: TrendingUp, label: 'Reinforcement' },
  release: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: ArrowRight, label: 'Release' }
};

const difficultyConfig = {
  easy: { color: 'bg-green-600 text-white', label: 'Accessible' },
  medium: { color: 'bg-amber-600 text-white', label: 'Moderate' },
  hard: { color: 'bg-red-600 text-white', label: 'Challenging' }
};

const nodeTypeColors: Record<NodeType, string> = {
  thought: 'bg-blue-100 text-blue-700',
  belief: 'bg-purple-100 text-purple-700',
  emotion: 'bg-pink-100 text-pink-700',
  action: 'bg-emerald-100 text-emerald-700',
  experience: 'bg-amber-100 text-amber-700',
  consequence: 'bg-red-100 text-red-700'
};

export function PathwayExplorer({
  pathways,
  currentState,
  onSelectPathway,
  onViewNode
}: PathwayExplorerProps) {
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<GrowthPathway['pathType'] | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'easy' | 'medium' | 'hard' | 'all'>('all');

  // Filter pathways
  const filteredPathways = pathways.filter(pathway => {
    if (filterType !== 'all' && pathway.pathType !== filterType) return false;
    if (filterDifficulty !== 'all' && pathway.metrics.difficulty !== filterDifficulty) return false;
    return true;
  });

  const selectedPathwayData = selectedPathway ? pathways.find(p => p.id === selectedPathway) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GitBranch className="h-7 w-7 text-purple-600" />
          Pathway Explorer
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Potential growth paths based on your current identity graph
        </p>
        {currentState && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Current State:</strong> {currentState}
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Path Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Types
              </button>
              {(Object.keys(pathTypeConfig) as Array<keyof typeof pathTypeConfig>).map(type => {
                const config = pathTypeConfig[type];
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      filterType === type
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

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Difficulty</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterDifficulty('all')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterDifficulty === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Levels
              </button>
              {(['easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                    filterDifficulty === diff
                      ? difficultyConfig[diff].color
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {difficultyConfig[diff].label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pathways Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPathways.map(pathway => {
          const typeConfig = pathTypeConfig[pathway.pathType];
          const TypeIcon = typeConfig.icon;
          const diffConfig = difficultyConfig[pathway.metrics.difficulty];
          const isSelected = selectedPathway === pathway.id;

          return (
            <Card
              key={pathway.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-purple-600 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPathway(pathway.id)}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <TypeIcon className="h-5 w-5 text-purple-600" />
                      <Badge className={`${diffConfig.color} border-0`}>
                        {diffConfig.label}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{pathway.name}</h3>
                    <p className="text-xs text-gray-600">{pathway.description}</p>
                  </div>

                  {/* Target State */}
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium mb-1">Target State</p>
                    <p className="text-sm text-purple-900">{pathway.targetState}</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-lg font-bold text-gray-900">
                        {pathway.metrics.totalDuration}d
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Steps</p>
                      <p className="text-lg font-bold text-gray-900">
                        {pathway.steps.length}
                      </p>
                    </div>
                  </div>

                  {/* Confidence & Similarity */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Confidence</span>
                        <span className="font-medium text-gray-900">
                          {(pathway.metrics.avgConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${pathway.metrics.avgConfidence * 100}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {pathway.similarJourneys} similar journeys recorded
                    </p>
                  </div>

                  {/* Path Type Badge */}
                  <Badge className={`${typeConfig.color} border w-full justify-center`}>
                    {typeConfig.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Pathway Details */}
      {selectedPathwayData && (
        <Card className="border-2 border-purple-600">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-purple-600" />
              {selectedPathwayData.name} - Detailed Path
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Journey Overview */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-2">Starting Condition</p>
                <p className="text-sm text-blue-900">{selectedPathwayData.startingCondition}</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-600 font-medium mb-2">Target State</p>
                <p className="text-sm text-purple-900">{selectedPathwayData.targetState}</p>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Pathway Steps ({selectedPathwayData.steps.length})
              </h4>
              <div className="space-y-3">
                {selectedPathwayData.steps.map((step, index) => (
                  <div
                    key={step.order}
                    className="relative p-4 bg-gray-50 border border-gray-300 rounded-lg"
                  >
                    {/* Step connector line */}
                    {index < selectedPathwayData.steps.length - 1 && (
                      <div className="absolute left-6 top-full h-3 w-0.5 bg-gray-300" />
                    )}

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {step.order}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-gray-900">{step.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>~{step.estimatedDuration} days</span>
                          <span>•</span>
                          <span>{(step.confidence * 100).toFixed(0)}% confidence</span>
                        </div>

                        {step.createsNodes && step.createsNodes.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">May create:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.createsNodes.map((node, idx) => (
                                <Badge
                                  key={idx}
                                  className={`${nodeTypeColors[node.nodeType]} border-0 text-xs`}
                                >
                                  {node.nodeType}: {node.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {step.activatesNodes.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Activates nodes:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.activatesNodes.map((nodeId, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => onViewNode?.(nodeId)}
                                  className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                >
                                  {nodeId}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcome Prediction */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-900 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Predicted Outcome ({(selectedPathwayData.outcome.likelihood * 100).toFixed(0)}% likelihood)
              </h4>
              <p className="text-sm text-emerald-800 mb-3">{selectedPathwayData.outcome.description}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-emerald-900 mb-2">Positive Changes</p>
                  <ul className="space-y-1">
                    {selectedPathwayData.outcome.positiveChanges.map((change, idx) => (
                      <li key={idx} className="text-xs text-emerald-800 flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-900 mb-2">Challenges</p>
                  <ul className="space-y-1">
                    {selectedPathwayData.outcome.challenges.map((challenge, idx) => (
                      <li key={idx} className="text-xs text-emerald-800 flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">!</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Lens Context */}
            {selectedPathwayData.lensContext.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Lens Context:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPathwayData.lensContext.map((lens, idx) => (
                    <Badge key={idx} variant="outline">
                      {lens}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {onSelectPathway && (
              <Button
                onClick={() => onSelectPathway(selectedPathwayData.id)}
                className="w-full"
                size="lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Track This Pathway
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Possibilities, Not Prescriptions:</strong> These pathways are based on patterns
            from similar identity graphs. They're suggestions, not instructions. The AI can't tell
            you what to do - only show you how others have navigated similar terrain. Your path is yours to choose.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <PathwayExplorer
 *   currentState="Experiencing tension between career ambition and personal wellbeing"
 *   pathways={[
 *     {
 *       id: 'path_1',
 *       name: 'Integration Through Boundaries',
 *       description: 'Learn to honor both ambition and rest by setting clear boundaries',
 *       startingCondition: 'High tension between work drive and need for rest',
 *       targetState: 'Both needs honored through clear time boundaries',
 *       pathType: 'integration',
 *       steps: [
 *         {
 *           order: 1,
 *           description: 'Identify specific times when both needs conflict',
 *           estimatedDuration: 7,
 *           activatesNodes: ['node_123', 'node_456'],
 *           createsNodes: [{ label: 'Boundary awareness', nodeType: 'thought' }],
 *           confidence: 0.85
 *         }
 *       ],
 *       outcome: {
 *         description: 'You develop sustainable rhythm that honors both values',
 *         likelihood: 0.75,
 *         positiveChanges: ['Reduced tension', 'Better energy management'],
 *         challenges: ['Initial discomfort setting boundaries', 'Others may resist']
 *       },
 *       metrics: {
 *         totalDuration: 45,
 *         avgConfidence: 0.82,
 *         nodesAffected: 12,
 *         tensionsResolved: 2,
 *         difficulty: 'medium'
 *       },
 *       similarJourneys: 47,
 *       lensContext: ['work', 'health', 'relationships']
 *     }
 *   ]}
 *   onSelectPathway={(id) => console.log('Track pathway:', id)}
 *   onViewNode={(id) => console.log('View node:', id)}
 * />
 */
