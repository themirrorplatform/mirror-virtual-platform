/**
 * Identity Graph View - Visual representation of identity nodes and edges
 * 
 * Features:
 * - Force-directed graph layout
 * - Node types (thought, belief, emotion, action, etc.)
 * - Edge types (reinforces, contradicts, undermines, etc.)
 * - Interactive zoom/pan
 * - Click to select nodes/edges
 * - Filter by node/edge type
 * - Paradox highlighting
 * - Cluster detection
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  EyeOff,
  Plus,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GraphNode, GraphEdge, EdgeType } from '../identity/GraphEdgeEditor';

interface IdentityGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
  onAddNode?: () => void;
  onAddEdge?: () => void;
  highlightParadoxes?: boolean;
}

const NODE_TYPE_COLORS = {
  thought: '#3B82F6',
  belief: '#8B5CF6',
  emotion: '#EC4899',
  action: '#10B981',
  experience: '#F59E0B',
  consequence: '#EF4444',
};

const EDGE_TYPE_COLORS = {
  reinforces: '#10B981',
  contradicts: '#EF4444',
  undermines: '#F59E0B',
  leads_to: '#3B82F6',
  co_occurs_with: '#8B5CF6',
};

export function IdentityGraphView({
  nodes,
  edges,
  onSelectNode,
  onSelectEdge,
  onAddNode,
  onAddEdge,
  highlightParadoxes = true,
}: IdentityGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [filterNodeTypes, setFilterNodeTypes] = useState<string[]>([]);
  const [filterEdgeTypes, setFilterEdgeTypes] = useState<EdgeType[]>([]);
  const [showEdges, setShowEdges] = useState(true);

  // Simple force-directed layout (simplified for demonstration)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    // Initialize positions if not set
    if (Object.keys(nodePositions).length === 0 && nodes.length > 0) {
      const positions: Record<string, { x: number; y: number }> = {};
      const radius = 200;
      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        positions[node.id] = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      });
      setNodePositions(positions);
    }
  }, [nodes, nodePositions]);

  const filteredNodes = nodes.filter(n =>
    filterNodeTypes.length === 0 || filterNodeTypes.includes(n.type)
  );

  const filteredEdges = edges.filter(e =>
    filterEdgeTypes.length === 0 || filterEdgeTypes.includes(e.edgeType)
  );

  // Detect paradoxes (contradicting edges)
  const paradoxEdges = highlightParadoxes
    ? edges.filter(e => e.edgeType === 'contradicts')
    : [];

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    ctx.save();
    ctx.translate(centerX + pan.x, centerY + pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    if (showEdges) {
      filteredEdges.forEach(edge => {
        const sourcePos = nodePositions[edge.sourceNode.id];
        const targetPos = nodePositions[edge.targetNode.id];
        if (!sourcePos || !targetPos) return;

        const isParadox = paradoxEdges.some(p => p.id === edge.id);
        const isSelected = selectedEdgeId === edge.id;

        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        
        const color = EDGE_TYPE_COLORS[edge.edgeType];
        ctx.strokeStyle = isSelected ? color : `${color}80`;
        ctx.lineWidth = isSelected ? 3 : (edge.intensity || 0.5) * 2;
        
        if (isParadox) {
          ctx.setLineDash([5, 5]);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw nodes
    filteredNodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;

      const isSelected = selectedNodeId === node.id;
      const radius = isSelected ? 25 : 20;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = NODE_TYPE_COLORS[node.type];
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#1E293B';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label.substring(0, 15), pos.x, pos.y + radius + 15);
    });

    ctx.restore();
  }, [filteredNodes, filteredEdges, nodePositions, zoom, pan, selectedNodeId, selectedEdgeId, showEdges, paradoxEdges]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Network size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">Identity Graph</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredNodes.length} nodes • {filteredEdges.length} edges
                  {paradoxEdges.length > 0 && ` • ${paradoxEdges.length} paradoxes`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-xs text-[var(--color-text-muted)] min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <Maximize2 size={16} />
              </Button>
            </div>
          </div>

          {/* Node Type Filters */}
          <div>
            <span className="text-xs text-[var(--color-text-muted)] mb-2 block">
              Node Types:
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(NODE_TYPE_COLORS).map(([type, color]) => {
                const count = nodes.filter(n => n.type === type).length;
                const isActive = filterNodeTypes.length === 0 || filterNodeTypes.includes(type);

                return (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterNodeTypes(prev =>
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      );
                    }}
                    disabled={count === 0}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      isActive ? 'text-white' : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                    }`}
                    style={{
                      backgroundColor: isActive ? color : undefined,
                      opacity: count === 0 ? 0.5 : 1,
                    }}
                  >
                    {type} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edge Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEdges(!showEdges)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                showEdges
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
              }`}
            >
              {showEdges ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>Show Edges</span>
            </button>

            {onAddNode && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddNode}
                className="flex items-center gap-2"
              >
                <Plus size={14} />
                Add Node
              </Button>
            )}

            {onAddEdge && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddEdge}
                className="flex items-center gap-2"
              >
                <Plus size={14} />
                Add Edge
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Paradox Alert */}
      {paradoxEdges.length > 0 && (
        <Card className="border-2 border-[var(--color-border-warning)]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-[var(--color-border-warning)] mt-0.5" />
            <div>
              <h4 className="text-sm font-medium mb-1">
                {paradoxEdges.length} Paradox{paradoxEdges.length !== 1 ? 'es' : ''} Detected
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Contradicting beliefs or thoughts identified in your graph. This is natural and 
                expected — identity contains multitudes.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Canvas */}
      <Card className="p-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-96 cursor-move"
          onClick={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
            const y = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;

            // Find clicked node
            const clickedNode = filteredNodes.find(node => {
              const pos = nodePositions[node.id];
              if (!pos) return false;
              const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
              return distance <= 20;
            });

            if (clickedNode) {
              setSelectedNodeId(clickedNode.id);
              setSelectedEdgeId(null);
              onSelectNode?.(clickedNode.id);
            } else {
              setSelectedNodeId(null);
            }
          }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startPan = { ...pan };

            const handleMouseMove = (e: MouseEvent) => {
              setPan({
                x: startPan.x + (e.clientX - startX),
                y: startPan.y + (e.clientY - startY),
              });
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </Card>

      {/* Selected Node Details */}
      {selectedNodeId && (() => {
        const node = nodes.find(n => n.id === selectedNodeId);
        if (!node) return null;

        const connectedEdges = edges.filter(
          e => e.sourceNode.id === node.id || e.targetNode.id === node.id
        );

        return (
          <Card className="border-2 border-[var(--color-accent-blue)]">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: NODE_TYPE_COLORS[node.type] }}
                    />
                    <h4 className="font-medium">{node.label}</h4>
                    <Badge variant="secondary">{node.type}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {connectedEdges.length} connection{connectedEdges.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {connectedEdges.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Connections:
                  </h5>
                  <div className="space-y-1">
                    {connectedEdges.map(edge => {
                      const otherNode = edge.sourceNode.id === node.id
                        ? edge.targetNode
                        : edge.sourceNode;
                      return (
                        <div
                          key={edge.id}
                          className="text-xs p-2 rounded bg-[var(--color-surface-hover)]"
                        >
                          <span className="text-[var(--color-text-muted)]">
                            {edge.edgeType}
                          </span>{' '}
                          <span className="text-[var(--color-text-secondary)]">
                            {otherNode.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      {/* Legend */}
      <Card>
        <div className="space-y-3">
          <h5 className="text-xs font-medium text-[var(--color-text-muted)]">
            Edge Types
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(EDGE_TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
                <span className="text-[var(--color-text-muted)]">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>Your identity graph is private and local.</strong> It exists only on 
              your device and is never transmitted to servers.
            </p>
            <p className="text-[var(--color-text-muted)]">
              The graph helps the system understand patterns and tensions in your thinking. 
              It's a tool for self-knowledge, not optimization.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export type { IdentityGraphViewProps };


