/**
 * Identity Graph - Hybrid Implementation
 * 
 * Figma's beautiful UI + Our time-travel backend
 * Shows identity nodes, tensions, patterns over time
 */

import { useState, useEffect, useCallback } from 'react';
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
import { Clock, Download, Eye, Lock, Globe, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Node types from backend
type NodeOrigin = 'user' | 'inferred' | 'commons';
type NodeLayer = 'emotional' | 'narrative' | 'behavioral' | 'temporal';

interface BackendNode {
  node_id: string;
  node_type: string;
  content: string;
  strength: number;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  origin?: NodeOrigin;
  layer?: NodeLayer;
  learning_enabled?: boolean;
  commons_shared?: boolean;
}

interface BackendEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  weight: number;
}

interface IdentityGraphData {
  instance_id: string;
  nodes: BackendNode[];
  edges: BackendEdge[];
  current_posture: string | null;
  dominant_tensions: string[];
  state_hash: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getNodeColor = (nodeType: string): string => {
  const colors: Record<string, string> = {
    tension: 'var(--color-error)',
    belief: 'var(--color-accent-blue)',
    goal: 'var(--color-accent-green)',
    paradox: 'var(--color-warning)',
    loop: 'var(--color-accent-purple)',
    pattern: 'var(--color-accent-violet)',
    emotional: 'var(--color-accent-violet)',
    narrative: 'var(--color-accent-gold)',
    behavioral: 'var(--color-accent-cyan)',
    temporal: 'var(--color-accent-blue)',
  };
  return colors[nodeType] || 'var(--color-text-secondary)';
};

const getOriginIcon = (origin: NodeOrigin) => {
  switch (origin) {
    case 'user': return <User className="w-3 h-3" />;
    case 'inferred': return <Zap className="w-3 h-3" />;
    case 'commons': return <Globe className="w-3 h-3" />;
    default: return null;
  }
};

function User({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IdentityGraph() {
  const [graphData, setGraphData] = useState<IdentityGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<BackendNode | null>(null);
  const [timeTravel, setTimeTravel] = useState<Date | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load identity graph from backend
  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = timeTravel 
        ? `${API_BASE}/v1/identity/graph?at=${timeTravel.toISOString()}`
        : `${API_BASE}/v1/identity/graph`;
      
      const response = await axios.get<IdentityGraphData>(endpoint);
      setGraphData(response.data);
      
      // Convert backend nodes to ReactFlow format
      const flowNodes: Node[] = response.data.nodes.map((node, idx) => ({
        id: node.node_id,
        type: 'custom',
        position: { x: Math.random() * 600, y: Math.random() * 400 },
        data: {
          label: node.content,
          nodeType: node.node_type,
          origin: node.origin || 'inferred',
          layer: node.layer || 'emotional',
          strength: node.strength,
          occurrenceCount: node.occurrence_count,
          learningEnabled: node.learning_enabled !== false,
          commonsShared: node.commons_shared || false,
        },
      }));
      
      // Convert backend edges to ReactFlow format
      const flowEdges: Edge[] = response.data.edges.map((edge) => ({
        id: edge.edge_id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: 'smoothstep',
        animated: edge.edge_type === 'tension',
        style: { 
          stroke: getNodeColor(edge.edge_type),
          strokeWidth: edge.weight * 3,
          opacity: 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getNodeColor(edge.edge_type),
        },
        label: edge.edge_type,
      }));
      
      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err: any) {
      console.error('Failed to load identity graph:', err);
      setError(err.response?.data?.detail || 'Failed to load identity graph');
    } finally {
      setLoading(false);
    }
  }, [timeTravel, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const handleExport = () => {
    if (!graphData) return;
    
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `identity-graph-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Custom node component
  const CustomNode = ({ data }: { data: any }) => {
    const color = getNodeColor(data.layer || data.nodeType);
    
    return (
      <div
        className="px-4 py-3 rounded-lg border-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderColor: color,
          minWidth: '180px',
          maxWidth: '220px',
        }}
        onClick={() => {
          const node = graphData?.nodes.find(n => n.content === data.label);
          if (node) setSelectedNode(node);
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div style={{ color }}>
              {getOriginIcon(data.origin)}
            </div>
            <span className="text-xs font-medium" style={{ color }}>
              {data.layer}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {data.learningEnabled && <Zap className="w-3 h-3 text-[var(--color-accent-gold)]" />}
            {data.commonsShared ? (
              <Globe className="w-3 h-3 text-[var(--color-accent-violet)]" />
            ) : (
              <Lock className="w-3 h-3 text-[var(--color-text-muted)]" />
            )}
          </div>
        </div>
        
        <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2 line-clamp-2">
          {data.label}
        </div>
        
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>×{data.occurrenceCount}</span>
          <span className="px-2 py-0.5 rounded-full" style={{ 
            backgroundColor: `${color}20`,
            color 
          }}>
            {Math.round(data.strength * 100)}%
          </span>
        </div>
      </div>
    );
  };

  const nodeTypes = { custom: CustomNode };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--color-text-muted)] mb-2">Loading identity graph...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-3" />
          <div className="text-[var(--color-error)] mb-2">{error}</div>
          <button
            onClick={loadGraph}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent-gold)] text-black hover:bg-[var(--color-accent-gold-deep)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        style={{
          backgroundColor: 'var(--color-base-default)',
        }}
      >
        <Background color="var(--color-border-subtle)" />
        <Controls />
        <MiniMap 
          nodeColor={(node) => getNodeColor(node.data.layer || node.data.nodeType)}
          style={{
            backgroundColor: 'var(--color-surface-card)',
          }}
        />
        
        <Panel position="top-left" className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => setTimeTravel(timeTravel ? null : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors text-sm"
          >
            <Clock className="w-4 h-4" />
            {timeTravel ? 'Back to Present' : 'Time Travel'}
          </button>
        </Panel>
        
        {graphData && (
          <Panel position="top-right" className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-3 max-w-xs">
            <div className="text-xs text-[var(--color-text-muted)] mb-1">Current State</div>
            <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
              {graphData.nodes.length} nodes • {graphData.edges.length} edges
            </div>
            {graphData.current_posture && (
              <div className="text-xs text-[var(--color-text-secondary)]">
                Posture: {graphData.current_posture}
              </div>
            )}
          </Panel>
        )}
      </ReactFlow>
      
      {/* Node detail panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-[var(--color-surface-card)] border border-[var(--color-border-emphasis)] rounded-lg p-4 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-serif text-lg text-[var(--color-text-primary)]">{selectedNode.content}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Type</span>
              <span className="text-[var(--color-text-primary)]">{selectedNode.node_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Origin</span>
              <span className="text-[var(--color-text-primary)]">{selectedNode.origin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Layer</span>
              <span className="text-[var(--color-text-primary)]">{selectedNode.layer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Strength</span>
              <span className="text-[var(--color-text-primary)]">{Math.round(selectedNode.strength * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Occurrences</span>
              <span className="text-[var(--color-text-primary)]">×{selectedNode.occurrence_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">First seen</span>
              <span className="text-[var(--color-text-primary)]">{selectedNode.first_seen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Last seen</span>
              <span className="text-[var(--color-text-primary)]">{selectedNode.last_seen}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
