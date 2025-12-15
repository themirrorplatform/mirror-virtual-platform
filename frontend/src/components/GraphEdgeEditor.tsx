import React, { useState } from 'react';
import { Link2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import type { GraphNode, NodeType, EdgeType } from './IdentityGraphView';

/**
 * GraphEdgeEditor - Edge Creation/Editing Component
 * 
 * Features:
 * - Create/edit relationships between nodes
 * - Edge type selector (5 types: reinforces, contradicts, undermines, leads_to, co_occurs_with)
 * - Frequency slider (0-100, how often this relationship occurs)
 * - Intensity slider (0-1, how strong the relationship is)
 * - Confidence slider (0-1, how certain you are about this relationship)
 * - Node selector with type badges
 * 
 * Constitutional Note: You define relationships, not the system.
 * These connections reflect your understanding, which can change.
 */

interface GraphEdge {
  id?: string;
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  frequency: number; // 0-1 scale
  intensity: number; // 0-1 scale
  confidence: number; // 0-1 scale
}

interface GraphEdgeEditorProps {
  availableNodes: GraphNode[];
  existingEdge?: GraphEdge;
  preselectedSourceId?: string;
  preselectedTargetId?: string;
  onSave: (edge: GraphEdge) => Promise<void>;
  onCancel?: () => void;
}

const EDGE_TYPES: { value: EdgeType; label: string; description: string; color: string }[] = [
  {
    value: 'reinforces',
    label: 'Reinforces',
    description: 'One pattern strengthens or supports another',
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  {
    value: 'contradicts',
    label: 'Contradicts',
    description: 'One pattern conflicts with or opposes another',
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  {
    value: 'undermines',
    label: 'Undermines',
    description: 'One pattern weakens or sabotages another',
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  {
    value: 'leads_to',
    label: 'Leads To',
    description: 'One pattern causally results in another',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    value: 'co_occurs_with',
    label: 'Co-occurs With',
    description: 'Two patterns happen together without clear causation',
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  }
];

export function GraphEdgeEditor({
  availableNodes,
  existingEdge,
  preselectedSourceId,
  preselectedTargetId,
  onSave,
  onCancel
}: GraphEdgeEditorProps) {
  const [sourceId, setSourceId] = useState(existingEdge?.sourceId || preselectedSourceId || '');
  const [targetId, setTargetId] = useState(existingEdge?.targetId || preselectedTargetId || '');
  const [edgeType, setEdgeType] = useState<EdgeType>(existingEdge?.edgeType || 'reinforces');
  const [frequency, setFrequency] = useState(existingEdge?.frequency || 0.5);
  const [intensity, setIntensity] = useState(existingEdge?.intensity || 0.5);
  const [confidence, setConfidence] = useState(existingEdge?.confidence || 0.5);
  const [isSaving, setIsSaving] = useState(false);

  // Get node by ID
  const getNode = (id: string) => availableNodes.find(n => n.id === id);
  const sourceNode = getNode(sourceId);
  const targetNode = getNode(targetId);

  // Validation
  const isValid = sourceId && targetId && sourceId !== targetId;

  // Handle save
  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      await onSave({
        id: existingEdge?.id,
        sourceId,
        targetId,
        edgeType,
        frequency,
        intensity,
        confidence
      });
    } catch (error) {
      console.error('Failed to save edge:', error);
      alert('Failed to save relationship. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Node type colors
  const nodeColors: Record<NodeType, string> = {
    thought: 'bg-sky-100 text-sky-700',
    belief: 'bg-pink-100 text-pink-700',
    emotion: 'bg-amber-100 text-amber-700',
    action: 'bg-emerald-100 text-emerald-700',
    experience: 'bg-purple-100 text-purple-700',
    consequence: 'bg-orange-100 text-orange-700'
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {existingEdge ? 'Edit Relationship' : 'Create Relationship'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Source Node Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            From Node (Source)
          </label>
          <select
            value={sourceId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSourceId(e.target.value)}
            disabled={!!preselectedSourceId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select source node...</option>
            {availableNodes.map(node => (
              <option key={node.id} value={node.id}>
                {node.label} ({node.nodeType})
              </option>
            ))}
          </select>
          {sourceNode && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <Badge className={nodeColors[sourceNode.nodeType]}>
                {sourceNode.nodeType}
              </Badge>
              <span className="text-sm">{sourceNode.label}</span>
            </div>
          )}
        </div>

        {/* Target Node Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            To Node (Target)
          </label>
          <select
            value={targetId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetId(e.target.value)}
            disabled={!!preselectedTargetId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select target node...</option>
            {availableNodes
              .filter(node => node.id !== sourceId)
              .map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} ({node.nodeType})
                </option>
              ))}
          </select>
          {targetNode && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <Badge className={nodeColors[targetNode.nodeType]}>
                {targetNode.nodeType}
              </Badge>
              <span className="text-sm">{targetNode.label}</span>
            </div>
          )}
        </div>

        {/* Edge Type Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Relationship Type
          </label>
          <div className="space-y-2">
            {EDGE_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setEdgeType(type.value)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  edgeType === type.value
                    ? `${type.color} border-current`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-sm text-gray-600 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Frequency
            </label>
            <Badge variant="outline" className="text-sm">
              {Math.round(frequency * 100)}%
            </Badge>
          </div>
          <Slider
            value={[frequency * 100]}
            onValueChange={(values) => setFrequency(values[0] / 100)}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Rare</span>
            <span>Sometimes</span>
            <span>Very Often</span>
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            How often does this relationship occur?
          </p>
        </div>

        {/* Intensity Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Intensity
            </label>
            <Badge variant="outline" className="text-sm">
              {(intensity * 10).toFixed(1)}/10
            </Badge>
          </div>
          <Slider
            value={[intensity * 100]}
            onValueChange={(values) => setIntensity(values[0] / 100)}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Weak</span>
            <span>Moderate</span>
            <span>Strong</span>
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            How strong is this relationship when it occurs?
          </p>
        </div>

        {/* Confidence Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Confidence
            </label>
            <Badge variant="outline" className="text-sm">
              {Math.round(confidence * 100)}%
            </Badge>
          </div>
          <Slider
            value={[confidence * 100]}
            onValueChange={(values) => setConfidence(values[0] / 100)}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Uncertain</span>
            <span>Fairly Sure</span>
            <span>Very Confident</span>
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            How certain are you about this relationship?
          </p>
        </div>

        {/* Preview */}
        {sourceNode && targetNode && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Preview</h4>
            <div className="flex items-center gap-2 text-sm">
              <Badge className={nodeColors[sourceNode.nodeType]}>
                {sourceNode.label}
              </Badge>
              <span className="text-purple-600 font-medium">
                {EDGE_TYPES.find(t => t.value === edgeType)?.label}
              </span>
              <Badge className={nodeColors[targetNode.nodeType]}>
                {targetNode.label}
              </Badge>
            </div>
            <div className="mt-3 text-xs text-gray-600 space-y-1">
              <div>Frequency: {Math.round(frequency * 100)}%</div>
              <div>Intensity: {(intensity * 10).toFixed(1)}/10</div>
              <div>Confidence: {Math.round(confidence * 100)}%</div>
            </div>
          </div>
        )}

        {/* Constitutional Note */}
        <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
          <strong>Your interpretation matters:</strong> These relationships reflect your 
          current understanding of patterns. They can be adjusted or removed as your 
          perspective evolves. There's no "correct" relationship—only what makes sense to you now.
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : existingEdge ? 'Update Relationship' : 'Create Relationship'}
          </Button>
        </div>

        {!isValid && sourceId && targetId && sourceId === targetId && (
          <p className="text-xs text-amber-600 text-center">
            Source and target must be different nodes
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * <GraphEdgeEditor
 *   availableNodes={[
 *     {
 *       id: 'node_1',
 *       label: 'Fear of failure',
 *       content: '...',
 *       nodeType: 'thought',
 *       lensTags: ['anxiety'],
 *       activationCount: 42
 *     },
 *     {
 *       id: 'node_2',
 *       label: 'Procrastination',
 *       content: '...',
 *       nodeType: 'action',
 *       lensTags: ['work'],
 *       activationCount: 28
 *     }
 *   ]}
 *   preselectedSourceId="node_1"
 *   onSave={async (edge) => {
 *     await createEdge(edge);
 *     console.log('Edge created!');
 *   }}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */


