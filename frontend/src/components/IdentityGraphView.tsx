import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Filter, ZoomIn, ZoomOut, Maximize, Tag as TagIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * IdentityGraphView - Force-Directed Graph Visualization
 * 
 * Features:
 * - 6 node types: thought, belief, emotion, action, experience, consequence
 * - 5 edge types: reinforces, contradicts, undermines, leads_to, co_occurs_with
 * - Interactive drag/zoom/filter
 * - Color coding by node type
 * - Click to select and expand nodes
 * - Lens tag filtering
 * 
 * Constitutional Note: This is your LOCAL identity graph.
 * It never leaves your device without explicit consent.
 * It's data, not diagnosis—a map, not a mandate.
 */

export type NodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
export type EdgeType = 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';

export interface GraphNode {
  id: string;
  label: string;
  content: string;
  nodeType: NodeType;
  lensTags: string[];
  activationCount: number;
  lastActivated?: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  frequency: number;
  intensity: number;
  confidence: number;
}

interface IdentityGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  onNodesChange?: (nodes: GraphNode[]) => void;
  selectedLensTags?: string[];
  height?: string;
}

// Node type colors
const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  thought: { bg: '#E0F2FE', border: '#0EA5E9', text: '#0369A1' },
  belief: { bg: '#FCE7F3', border: '#EC4899', text: '#9F1239' },
  emotion: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  action: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  experience: { bg: '#E9D5FF', border: '#A855F7', text: '#6B21A8' },
  consequence: { bg: '#FED7AA', border: '#F97316', text: '#9A3412' }
};

// Edge type colors
const EDGE_COLORS: Record<EdgeType, string> = {
  reinforces: '#10B981',
  contradicts: '#EF4444',
  undermines: '#F59E0B',
  leads_to: '#3B82F6',
  co_occurs_with: '#8B5CF6'
};

export function IdentityGraphView({
  nodes: graphNodes,
  edges: graphEdges,
  onNodeClick,
  onEdgeClick,
  onNodesChange,
  selectedLensTags = [],
  height = '600px'
}: IdentityGraphViewProps) {
  const [filterNodeType, setFilterNodeType] = useState<NodeType | null>(null);
  const [filterLensTag, setFilterLensTag] = useState<string | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Convert graph nodes to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return graphNodes.map((node, index) => ({
      id: node.id,
      type: 'default',
      position: {
        // Simple circular layout as starting point
        x: 400 + 200 * Math.cos((2 * Math.PI * index) / graphNodes.length),
        y: 300 + 200 * Math.sin((2 * Math.PI * index) / graphNodes.length)
      },
      data: {
        label: (
          <div className="px-3 py-2">
            <div className="font-medium text-sm">{node.label}</div>
            <div className="text-xs text-gray-600 mt-1">{node.content.slice(0, 50)}...</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {node.lensTags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ),
        ...node
      },
      style: {
        background: NODE_COLORS[node.nodeType].bg,
        border: `2px solid ${NODE_COLORS[node.nodeType].border}`,
        borderRadius: '8px',
        padding: 0,
        width: 180,
        fontSize: '12px',
        color: NODE_COLORS[node.nodeType].text
      }
    }));
  }, [graphNodes]);

  // Convert graph edges to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return graphEdges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'smoothstep',
      animated: edge.intensity > 0.7,
      style: {
        stroke: EDGE_COLORS[edge.edgeType],
        strokeWidth: 1 + edge.frequency * 2,
        opacity: edge.confidence
      },
      label: edge.edgeType.replace('_', ' '),
      labelStyle: {
        fontSize: '10px',
        fill: EDGE_COLORS[edge.edgeType]
      },
      data: edge
    }));
  }, [graphEdges]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  // Filter nodes and edges
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const graphNode = node.data as GraphNode;
      const matchesNodeType = !filterNodeType || graphNode.nodeType === filterNodeType;
      const matchesLensTag = !filterLensTag || graphNode.lensTags.includes(filterLensTag);
      return matchesNodeType && matchesLensTag;
    });
  }, [nodes, filterNodeType, filterLensTag]);

  const filteredEdges = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge => 
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  // Handle node click
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.data as GraphNode);
      }
    },
    [onNodeClick]
  );

  // Handle edge click
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.data as GraphEdge);
      }
    },
    [onEdgeClick]
  );

  // Get all unique lens tags
  const allLensTags = useMemo(() => {
    const tags = new Set<string>();
    graphNodes.forEach(node => {
      node.lensTags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [graphNodes]);

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Filter by Node Type */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter by Node Type
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterNodeType === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterNodeType(null)}
              >
                All ({graphNodes.length})
              </Button>
              {(Object.keys(NODE_COLORS) as NodeType[]).map(type => {
                const count = graphNodes.filter(n => n.nodeType === type).length;
                return (
                  <Button
                    key={type}
                    variant={filterNodeType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterNodeType(type)}
                    style={{
                      borderColor: filterNodeType === type ? NODE_COLORS[type].border : undefined,
                      backgroundColor: filterNodeType === type ? NODE_COLORS[type].bg : undefined,
                      color: filterNodeType === type ? NODE_COLORS[type].text : undefined
                    }}
                  >
                    {type} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Filter by Lens Tag */}
          {allLensTags.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Filter by Lens Tag
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterLensTag === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLensTag(null)}
                >
                  All Tags
                </Button>
                {allLensTags.map(tag => (
                  <Button
                    key={tag}
                    variant={filterLensTag === tag ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterLensTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* View Options */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showMiniMap}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowMiniMap(e.target.checked)}
                className="rounded"
              />
              Show Mini Map
            </label>
            <span className="text-xs text-gray-500">
              {filteredNodes.length} nodes, {filteredEdges.length} edges visible
            </span>
          </div>
        </div>
      </Card>

      {/* Graph View */}
      <Card style={{ height }}>
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChangeInternal}
          onEdgesChange={onEdgesChangeInternal}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          connectionMode={ConnectionMode.Loose}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background />
          {showMiniMap && (
            <MiniMap
              nodeColor={(node) => {
                const graphNode = node.data as GraphNode;
                return NODE_COLORS[graphNode.nodeType].border;
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          )}
          
          {/* Constitutional Note Panel */}
          <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-md max-w-xs">
            <p className="text-xs text-gray-600 italic">
              <strong>Local-only graph:</strong> This visualization never leaves your device. 
              Drag nodes to explore, click to expand, filter by lens or type.
            </p>
          </Panel>
        </ReactFlow>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Legend</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Node Types */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Node Types</h4>
            <div className="space-y-1">
              {(Object.keys(NODE_COLORS) as NodeType[]).map(type => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: NODE_COLORS[type].bg,
                      border: `2px solid ${NODE_COLORS[type].border}`
                    }}
                  />
                  <span className="text-xs capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edge Types */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Edge Types</h4>
            <div className="space-y-1">
              {(Object.keys(EDGE_COLORS) as EdgeType[]).map(type => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-8 h-0.5"
                    style={{ backgroundColor: EDGE_COLORS[type] }}
                  />
                  <span className="text-xs">{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <IdentityGraphView
 *   nodes={[
 *     {
 *       id: 'node_1',
 *       label: 'Fear of failure',
 *       content: 'Recurring thought pattern when starting new projects',
 *       nodeType: 'thought',
 *       lensTags: ['anxiety', 'work'],
 *       activationCount: 42,
 *       lastActivated: '2024-01-15T10:00:00Z'
 *     }
 *   ]}
 *   edges={[
 *     {
 *       id: 'edge_1',
 *       sourceId: 'node_1',
 *       targetId: 'node_2',
 *       edgeType: 'leads_to',
 *       frequency: 0.8,
 *       intensity: 0.9,
 *       confidence: 0.85
 *     }
 *   ]}
 *   onNodeClick={(node) => console.log('Node clicked:', node)}
 *   selectedLensTags={['anxiety']}
 *   height="800px"
 * />
 */


