"""
Identity Graph Visualization Component
Force-directed graph with time-travel, node/edge exploration
Uses @xyflow/react for graph rendering
"""

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, TrendingUp, Zap, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface GraphNode {
  node_id: string;
  node_type: string;
  content: string;
  strength: number;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  evidence?: string[];
}

interface GraphEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  weight: number;
}

interface IdentityGraphData {
  instance_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  current_posture: string | null;
  dominant_tensions: string[];
  state_hash: string;
}

const getNodeColor = (nodeType: string): string => {
  const colors: Record<string, string> = {
    tension: '#ef4444',      // red
    belief: '#3b82f6',       // blue
    goal: '#10b981',         // green
    paradox: '#f59e0b',      // amber
    loop: '#8b5cf6',         // purple
    pattern: '#ec4899'       // pink
  };
  return colors[nodeType] || '#6b7280';
};

const getNodeIcon = (nodeType: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    tension: <AlertCircle className="w-4 h-4" />,
    belief: <Zap className="w-4 h-4" />,
    goal: <TrendingUp className="w-4 h-4" />,
    pattern: <div className="w-4 h-4">◈</div>
  };
  return iconMap[nodeType] || <div className="w-4 h-4">●</div>;
};

const CustomNode: React.FC<{ data: any }> = ({ data }) => {
  const color = getNodeColor(data.nodeType);
  const opacity = data.strength || 0.5;

  return (
    <div
      className="px-4 py-2 rounded-lg border-2 bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      style={{ 
        borderColor: color,
        minWidth: '150px',
        maxWidth: '200px'
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div style={{ color }}>
          {getNodeIcon(data.nodeType)}
        </div>
        <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
          {data.nodeType}
        </Badge>
      </div>
      <div className="text-sm font-medium text-gray-800 line-clamp-2">
        {data.content}
      </div>
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>×{data.occurrenceCount}</span>
        <span>{Math.round(opacity * 100)}%</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export const IdentityGraphVisualization: React.FC = () => {
  const [graphData, setGraphData] = useState<IdentityGraphData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Time travel state
  const [timeTravelDate, setTimeTravelDate] = useState<string | null>(null);
  const [isTimeTraveling, setIsTimeTraveling] = useState(false);

  const loadGraph = async (asOfDate?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('mirror_auth_token');
      const endpoint = asOfDate 
        ? `http://localhost:8000/v1/identity/timetravel`
        : `http://localhost:8000/v1/identity/graph`;

      const options: RequestInit = {
        method: asOfDate ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (asOfDate) {
        options.body = JSON.stringify({ cutoff_timestamp: asOfDate });
      }

      const response = await fetch(endpoint, options);

      if (!response.ok) {
        throw new Error('Failed to load identity graph');
      }

      const data: IdentityGraphData = await response.json();
      setGraphData(data);
      convertToFlowGraph(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Load graph error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToFlowGraph = (data: IdentityGraphData) => {
    // Convert GraphNodes to ReactFlow nodes
    const flowNodes: Node[] = data.nodes.map((node, index) => ({
      id: node.node_id,
      type: 'custom',
      position: {
        // Simple circular layout - would use force-directed in production
        x: 400 + 300 * Math.cos((2 * Math.PI * index) / data.nodes.length),
        y: 300 + 300 * Math.sin((2 * Math.PI * index) / data.nodes.length)
      },
      data: {
        content: node.content,
        nodeType: node.node_type,
        strength: node.strength,
        occurrenceCount: node.occurrence_count,
        isDominant: data.dominant_tensions.includes(node.node_id)
      }
    }));

    // Convert GraphEdges to ReactFlow edges
    const flowEdges: Edge[] = data.edges.map(edge => ({
      id: edge.edge_id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      label: edge.edge_type,
      type: 'smoothstep',
      animated: edge.weight > 0.7,
      style: {
        stroke: edge.weight > 0.7 ? '#ef4444' : '#94a3b8',
        strokeWidth: Math.max(1, edge.weight * 3)
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.weight > 0.7 ? '#ef4444' : '#94a3b8'
      }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const graphNode = graphData?.nodes.find(n => n.node_id === node.id);
    setSelectedNode(graphNode || null);
  }, [graphData]);

  const handleTimeTravel = async (direction: 'past' | 'present') => {
    if (direction === 'present') {
      setTimeTravelDate(null);
      setIsTimeTraveling(false);
      await loadGraph();
    } else {
      // Travel to 30 days ago
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const isoDate = pastDate.toISOString();
      setTimeTravelDate(isoDate);
      setIsTimeTraveling(true);
      await loadGraph(isoDate);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading identity graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => loadGraph()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Graph Visualization */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeColor={(node) => getNodeColor(node.data.nodeType)}
            maskColor="rgba(0, 0, 0, 0.1)"
          />

          {/* Time Travel Controls */}
          <Panel position="top-center">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTimeTravel('past')}
                    disabled={isTimeTraveling}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    30 Days Ago
                  </Button>

                  {isTimeTraveling && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Viewing: {new Date(timeTravelDate!).toLocaleDateString()}</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTimeTravel('present')}
                    disabled={!isTimeTraveling}
                  >
                    Present
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Panel>

          {/* Stats Panel */}
          <Panel position="top-left">
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Identity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nodes:</span>
                  <span className="font-semibold">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connections:</span>
                  <span className="font-semibold">{edges.length}</span>
                </div>
                {graphData?.current_posture && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600">Current Posture:</span>
                    <div className="font-semibold text-blue-600 mt-1">
                      {graphData.current_posture}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Details Sidebar */}
      {selectedNode && (
        <div className="w-80 border-l bg-white p-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div style={{ color: getNodeColor(selectedNode.node_type) }}>
                  {getNodeIcon(selectedNode.node_type)}
                </div>
                <CardTitle className="text-lg">Node Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: getNodeColor(selectedNode.node_type),
                    color: getNodeColor(selectedNode.node_type)
                  }}
                >
                  {selectedNode.node_type}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Content</h3>
                <p className="text-sm text-gray-700">{selectedNode.content}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Strength:</span>
                  <span className="font-semibold">
                    {Math.round(selectedNode.strength * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Occurrences:</span>
                  <span className="font-semibold">×{selectedNode.occurrence_count}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t pt-4">
                <div>
                  <span className="text-gray-600">First Seen:</span>
                  <div className="font-mono text-xs mt-1">
                    {new Date(selectedNode.first_seen).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Last Seen:</span>
                  <div className="font-mono text-xs mt-1">
                    {new Date(selectedNode.last_seen).toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedNode.evidence && selectedNode.evidence.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 text-sm">Evidence</h3>
                  <div className="space-y-1">
                    {selectedNode.evidence.slice(0, 5).map((evidenceId, i) => (
                      <div key={i} className="text-xs font-mono text-gray-500 truncate">
                        {evidenceId}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setSelectedNode(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IdentityGraphVisualization;
