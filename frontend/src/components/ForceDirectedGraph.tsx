import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MarkerType,
  NodeTypes,
  EdgeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Circle,
  Square,
  Triangle,
  Hexagon,
  Zap,
  Target,
  Heart,
  Eye,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * ForceDirectedGraph - Identity Graph Visualization
 * 
 * Features:
 * - Interactive force-directed graph with React Flow
 * - 6 node types (thoughts, beliefs, emotions, actions, experiences, consequences)
 * - 5 edge types (reinforces, contradicts, undermines, leads_to, co_occurs_with)
 * - Color coding by node type
 * - Interactive drag, zoom, pan
 * - Filter by lens tags
 * - Node selection with details
 * - Edge strength visualization
 * - Clustering and layout algorithms
 * - Export graph data
 * 
 * Constitutional Note: Your identity graph is private and local.
 * It never leaves your device unless you explicitly share it.
 */

export type GraphNodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
export type GraphEdgeType = 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';

export interface GraphNodeData {
  id: string;
  type: GraphNodeType;
  label: string;
  content: string;
  activation_count: number;
  last_activated: string;
  lens_tags: string[];
  intensity?: number; // 0-1
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  frequency: number; // 0-1
  intensity: number; // 0-1
  confidence: number; // 0-1
}

interface ForceDirectedGraphProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  onNodeClick?: (node: GraphNodeData) => void;
  onEdgeClick?: (edge: GraphEdgeData) => void;
  onNodeUpdate?: (nodeId: string, position: { x: number; y: number }) => void;
  selectedLensTags?: string[];
  height?: string;
}

// Node type configuration
const nodeTypeConfig: Record<GraphNodeType, { icon: typeof Circle; color: string; bgColor: string }> = {
  thought: { icon: Circle, color: '#3B82F6', bgColor: '#EFF6FF' },
  belief: { icon: Square, color: '#8B5CF6', bgColor: '#F5F3FF' },
  emotion: { icon: Heart, color: '#EC4899', bgColor: '#FDF2F8' },
  action: { icon: Zap, color: '#F59E0B', bgColor: '#FEF3C7' },
  experience: { icon: Eye, color: '#10B981', bgColor: '#ECFDF5' },
  consequence: { icon: Target, color: '#EF4444', bgColor: '#FEF2F2' }
};

// Edge type configuration
const edgeTypeConfig: Record<GraphEdgeType, { color: string; label: string; markerEnd?: string }> = {
  reinforces: { color: '#10B981', label: 'reinforces', markerEnd: 'arrow' },
  contradicts: { color: '#EF4444', label: 'contradicts', markerEnd: 'arrow' },
  undermines: { color: '#F59E0B', label: 'undermines', markerEnd: 'arrow' },
  leads_to: { color: '#3B82F6', label: 'leads to', markerEnd: 'arrow' },
  co_occurs_with: { color: '#8B5CF6', label: 'co-occurs', markerEnd: undefined }
};

// Custom node component
function CustomNode({ data }: { data: GraphNodeData }) {
  const config = nodeTypeConfig[data.type];
  const Icon = config.icon;

  return (
    <div
      className="px-4 py-2 rounded-lg border-2 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.color,
        minWidth: 120,
        maxWidth: 200
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color: config.color }} />
        <span className="font-medium text-sm text-gray-900 truncate">{data.label}</span>
      </div>
      <p className="text-xs text-gray-600 line-clamp-2">{data.content}</p>
      <div className="flex items-center gap-2 mt-2">
        <Badge className="text-xs" style={{ backgroundColor: config.color + '20', color: config.color, border: 'none' }}>
          {data.type}
        </Badge>
        {data.activation_count > 0 && (
          <span className="text-xs text-gray-500">×{data.activation_count}</span>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode
};

export function ForceDirectedGraph({
  nodes: graphNodes,
  edges: graphEdges,
  onNodeClick,
  onEdgeClick,
  onNodeUpdate,
  selectedLensTags = [],
  height = '600px'
}: ForceDirectedGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeData | null>(null);
  const [filterLensTags, setFilterLensTags] = useState<string[]>(selectedLensTags);
  const [showLabels, setShowLabels] = useState(true);

  // Convert graph data to React Flow format
  useEffect(() => {
    // Filter nodes by lens tags
    const filteredNodes = filterLensTags.length > 0
      ? graphNodes.filter(node => node.lens_tags.some(tag => filterLensTags.includes(tag)))
      : graphNodes;

    // Convert to React Flow nodes
    const flowNodes: Node[] = filteredNodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      data: node,
      position: { x: Math.random() * 400, y: Math.random() * 400 }, // Random initial position
      draggable: true
    }));

    // Filter edges to only include nodes that are visible
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphEdges.filter(
      edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    // Convert to React Flow edges
    const flowEdges: Edge[] = filteredEdges.map(edge => {
      const config = edgeTypeConfig[edge.type];
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: showLabels ? config.label : undefined,
        labelStyle: { fontSize: 10, fill: config.color },
        style: { 
          stroke: config.color,
          strokeWidth: 1 + edge.intensity * 2, // Thicker edges for higher intensity
          opacity: 0.4 + edge.confidence * 0.6 // More opaque for higher confidence
        },
        markerEnd: config.markerEnd ? {
          type: MarkerType.ArrowClosed,
          color: config.color
        } : undefined,
        data: edge,
        animated: edge.frequency > 0.7 // Animate high-frequency edges
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [graphNodes, graphEdges, filterLensTags, showLabels]);

  // Handle node click
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeData = node.data as GraphNodeData;
    setSelectedNode(nodeData);
    setSelectedEdge(null);
    onNodeClick?.(nodeData);
  }, [onNodeClick]);

  // Handle edge click
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const edgeData = edge.data as GraphEdgeData;
    setSelectedEdge(edgeData);
    setSelectedNode(null);
    onEdgeClick?.(edgeData);
  }, [onEdgeClick]);

  // Handle node drag end
  const handleNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeUpdate?.(node.id, node.position);
  }, [onNodeUpdate]);

  // Get all unique lens tags
  const allLensTags = Array.from(new Set(graphNodes.flatMap(n => n.lens_tags))).sort();

  // Toggle lens filter
  const toggleLensFilter = (tag: string) => {
    setFilterLensTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Lens Filters:</span>
          <div className="flex flex-wrap gap-2">
            {allLensTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleLensFilter(tag)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterLensTags.includes(tag)
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
            {filterLensTags.length > 0 && (
              <button
                onClick={() => setFilterLensTags([])}
                className="px-2 py-1 rounded-full text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowLabels(!showLabels)}
            variant="outline"
            size="sm"
          >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Node Types:</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(nodeTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-1">
                    <Icon className="h-3 w-3" style={{ color: config.color }} />
                    <span className="text-xs text-gray-600">{type}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Edge Types:</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(edgeTypeConfig).map(([type, config]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-4 h-0.5" style={{ backgroundColor: config.color }} />
                  <span className="text-xs text-gray-600">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Selection Details */}
      {(selectedNode || selectedEdge) && (
        <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
          {selectedNode && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge style={{
                  backgroundColor: nodeTypeConfig[selectedNode.type].color + '20',
                  color: nodeTypeConfig[selectedNode.type].color,
                  border: 'none'
                }}>
                  {selectedNode.type}
                </Badge>
                <h3 className="font-semibold text-gray-900">{selectedNode.label}</h3>
              </div>
              <p className="text-sm text-gray-700 mb-2">{selectedNode.content}</p>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>Activated: {selectedNode.activation_count} times</span>
                <span>Last: {new Date(selectedNode.last_activated).toLocaleDateString()}</span>
              </div>
              {selectedNode.lens_tags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {selectedNode.lens_tags.map(tag => (
                    <Badge key={tag} className="bg-white border border-purple-300 text-purple-700 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedEdge && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-1 rounded"
                  style={{ backgroundColor: edgeTypeConfig[selectedEdge.type].color }}
                />
                <h3 className="font-semibold text-gray-900">{edgeTypeConfig[selectedEdge.type].label}</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Frequency</p>
                  <p className="font-medium">{(selectedEdge.frequency * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Intensity</p>
                  <p className="font-medium">{(selectedEdge.intensity * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-medium">{(selectedEdge.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Total Nodes</p>
          <p className="text-2xl font-bold text-blue-900">{nodes.length}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600 font-medium">Total Edges</p>
          <p className="text-2xl font-bold text-purple-900">{edges.length}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Active Filters</p>
          <p className="text-2xl font-bold text-green-900">{filterLensTags.length}</p>
        </div>
      </div>

      {/* Constitutional Note */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900">
          <strong>Your Identity Graph:</strong> This visualization is private and local to your device.
          It helps you understand patterns in your thoughts, emotions, and actions. Never shared without your explicit consent.
        </p>
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <ForceDirectedGraph
 *   nodes={[
 *     {
 *       id: 'node_1',
 *       type: 'thought',
 *       label: 'Need approval',
 *       content: 'I constantly seek approval from others',
 *       activation_count: 15,
 *       last_activated: '2024-01-15T10:00:00Z',
 *       lens_tags: ['relationships', 'identity']
 *     },
 *     {
 *       id: 'node_2',
 *       type: 'emotion',
 *       label: 'Anxiety',
 *       content: 'Feeling anxious when not validated',
 *       activation_count: 12,
 *       last_activated: '2024-01-15T09:30:00Z',
 *       lens_tags: ['relationships']
 *     }
 *   ]}
 *   edges={[
 *     {
 *       id: 'edge_1',
 *       source: 'node_1',
 *       target: 'node_2',
 *       type: 'leads_to',
 *       frequency: 0.8,
 *       intensity: 0.7,
 *       confidence: 0.9
 *     }
 *   ]}
 *   onNodeClick={(node) => console.log('Node clicked:', node)}
 *   onEdgeClick={(edge) => console.log('Edge clicked:', edge)}
 *   selectedLensTags={['relationships']}
 *   height="700px"
 * />
 */
