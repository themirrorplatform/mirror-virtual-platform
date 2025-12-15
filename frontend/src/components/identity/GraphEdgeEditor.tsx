/**
 * Graph Edge Editor - Create/edit relationships between identity nodes
 * 
 * Features:
 * - Edge type selector (5 types: reinforces, contradicts, undermines, leads_to, co_occurs_with)
 * - Frequency slider (0-1)
 * - Intensity slider (0-1)
 * - Confidence slider (0-1)
 * - Source and target node selection
 * - Preview visualization
 * - Save/delete actions
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link,
  Plus,
  Minus,
  X,
  Save,
  Trash2,
  Info,
  Check,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type EdgeType = 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';

interface GraphNode {
  id: string;
  label: string;
  type: 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
}

interface GraphEdge {
  id?: string;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  edgeType: EdgeType;
  frequency: number; // 0.0 - 1.0
  intensity: number; // 0.0 - 1.0
  confidence: number; // 0.0 - 1.0
}

interface GraphEdgeEditorProps {
  sourceNode: GraphNode;
  targetNode?: GraphNode;
  existingEdge?: GraphEdge;
  availableNodes?: GraphNode[];
  onSave: (edge: GraphEdge) => void;
  onDelete?: (edgeId: string) => void;
  onClose: () => void;
}

const EDGE_TYPES = [
  {
    id: 'reinforces' as EdgeType,
    label: 'Reinforces',
    description: 'One strengthens or supports the other',
    icon: <Plus size={18} />,
    color: '#10B981',
    symbol: '→+',
  },
  {
    id: 'contradicts' as EdgeType,
    label: 'Contradicts',
    description: 'One opposes or conflicts with the other',
    icon: <X size={18} />,
    color: '#EF4444',
    symbol: '↔',
  },
  {
    id: 'undermines' as EdgeType,
    label: 'Undermines',
    description: 'One weakens or destabilizes the other',
    icon: <Minus size={18} />,
    color: '#F59E0B',
    symbol: '→−',
  },
  {
    id: 'leads_to' as EdgeType,
    label: 'Leads To',
    description: 'One causes or triggers the other',
    icon: <ArrowRight size={18} />,
    color: '#3B82F6',
    symbol: '→',
  },
  {
    id: 'co_occurs_with' as EdgeType,
    label: 'Co-occurs With',
    description: 'Both tend to happen together',
    icon: <Link size={18} />,
    color: '#8B5CF6',
    symbol: '↔',
  },
];

const NODE_TYPE_COLORS = {
  thought: '#3B82F6',
  belief: '#8B5CF6',
  emotion: '#EC4899',
  action: '#10B981',
  experience: '#F59E0B',
  consequence: '#EF4444',
};

export function GraphEdgeEditor({
  sourceNode,
  targetNode: initialTargetNode,
  existingEdge,
  availableNodes = [],
  onSave,
  onDelete,
  onClose,
}: GraphEdgeEditorProps) {
  const [targetNode, setTargetNode] = useState<GraphNode | undefined>(initialTargetNode);
  const [edgeType, setEdgeType] = useState<EdgeType>(existingEdge?.edgeType || 'reinforces');
  const [frequency, setFrequency] = useState(existingEdge?.frequency ?? 0.5);
  const [intensity, setIntensity] = useState(existingEdge?.intensity ?? 0.5);
  const [confidence, setConfidence] = useState(existingEdge?.confidence ?? 0.5);

  const canSave = targetNode && edgeType;
  const isEditing = !!existingEdge;

  const handleSave = () => {
    if (!canSave || !targetNode) return;

    onSave({
      id: existingEdge?.id,
      sourceNode,
      targetNode,
      edgeType,
      frequency,
      intensity,
      confidence,
    });

    onClose();
  };

  const handleDelete = () => {
    if (existingEdge?.id && onDelete) {
      onDelete(existingEdge.id);
      onClose();
    }
  };

  const edgeTypeConfig = EDGE_TYPES.find(e => e.id === edgeType)!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Link size={24} className="text-[var(--color-accent-blue)] mt-1" />
                <div>
                  <h3 className="mb-1">
                    {isEditing ? 'Edit' : 'Create'} Relationship
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Connect two nodes in your identity graph
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            {/* Node Selection */}
            <div className="space-y-4">
              {/* Source Node (Fixed) */}
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <NodeDisplay node={sourceNode} />
              </div>

              {/* Target Node Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                {targetNode ? (
                  <NodeDisplay 
                    node={targetNode} 
                    onRemove={!isEditing ? () => setTargetNode(undefined) : undefined}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                      Select a target node:
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {availableNodes
                        .filter(node => node.id !== sourceNode.id)
                        .map(node => (
                          <button
                            key={node.id}
                            onClick={() => setTargetNode(node)}
                            className="w-full text-left"
                          >
                            <NodeDisplay node={node} selectable />
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Edge Type Selection */}
            {targetNode && (
              <>
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Relationship Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {EDGE_TYPES.map((type) => (
                      <EdgeTypeButton
                        key={type.id}
                        type={type}
                        selected={edgeType === type.id}
                        onSelect={() => setEdgeType(type.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <Card>
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${NODE_TYPE_COLORS[sourceNode.type]}20`,
                        color: NODE_TYPE_COLORS[sourceNode.type]
                      }}
                    >
                      {sourceNode.label}
                    </div>
                    <div 
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${edgeTypeConfig.color}20`,
                        color: edgeTypeConfig.color
                      }}
                    >
                      {edgeTypeConfig.icon}
                      <span>{edgeTypeConfig.symbol}</span>
                    </div>
                    <div 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${NODE_TYPE_COLORS[targetNode.type]}20`,
                        color: NODE_TYPE_COLORS[targetNode.type]
                      }}
                    >
                      {targetNode.label}
                    </div>
                  </div>
                </Card>

                {/* Sliders */}
                <div className="space-y-4">
                  <SliderControl
                    label="Frequency"
                    description="How often this relationship occurs"
                    value={frequency}
                    onChange={setFrequency}
                    color={edgeTypeConfig.color}
                  />
                  <SliderControl
                    label="Intensity"
                    description="How strong the relationship is"
                    value={intensity}
                    onChange={setIntensity}
                    color={edgeTypeConfig.color}
                  />
                  <SliderControl
                    label="Confidence"
                    description="How certain you are about this relationship"
                    value={confidence}
                    onChange={setConfidence}
                    color="#3B82F6"
                  />
                </div>

                {/* Info */}
                <Card className="border-2 border-[var(--color-accent-blue)]">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      <p className="mb-2">
                        <strong>Relationships help the system understand your identity.</strong> 
                        These connections are used to compute your TPV and suggest relevant doors.
                      </p>
                      <p className="text-[var(--color-text-muted)]">
                        This data never leaves your device.
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              {isEditing && onDelete && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-[var(--color-border-error)]"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              )}
              <div className={`flex items-center gap-2 ${isEditing ? '' : 'ml-auto'}`}>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {isEditing ? 'Update' : 'Create'} Relationship
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Sub-components

interface NodeDisplayProps {
  node: GraphNode;
  selectable?: boolean;
  onRemove?: () => void;
}

function NodeDisplay({ node, selectable, onRemove }: NodeDisplayProps) {
  return (
    <div 
      className={`p-3 rounded-lg border-2 transition-all ${
        selectable ? 'cursor-pointer hover:border-[var(--color-accent-blue)]' : ''
      }`}
      style={{
        borderColor: selectable ? 'var(--color-border-subtle)' : NODE_TYPE_COLORS[node.type],
        backgroundColor: `${NODE_TYPE_COLORS[node.type]}10`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm">
            {node.type}
          </Badge>
          <span className="font-medium">{node.label}</span>
        </div>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

interface EdgeTypeButtonProps {
  type: typeof EDGE_TYPES[0];
  selected: boolean;
  onSelect: () => void;
}

function EdgeTypeButton({ type, selected, onSelect }: EdgeTypeButtonProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-3 rounded-lg border-2 transition-all text-left"
      style={{
        borderColor: selected ? type.color : 'var(--color-border-subtle)',
        backgroundColor: selected ? `${type.color}10` : 'var(--color-surface-card)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div style={{ color: type.color }}>
          {type.icon}
        </div>
        <span className="text-sm font-medium">{type.label}</span>
        {selected && (
          <Check size={14} className="ml-auto" style={{ color: type.color }} />
        )}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        {type.description}
      </p>
    </motion.button>
  );
}

interface SliderControlProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

function SliderControl({ label, description, value, onChange, color }: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{label}</label>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
        <Badge variant="secondary">
          {Math.round(value * 100)}%
        </Badge>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value * 100}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(parseInt(e.target.value) / 100)}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 100}%, var(--color-border-subtle) ${value * 100}%, var(--color-border-subtle) 100%)`,
        }}
      />
    </div>
  );
}

export type { GraphNode, GraphEdge };



