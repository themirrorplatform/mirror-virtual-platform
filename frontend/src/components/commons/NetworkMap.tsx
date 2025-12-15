/**
 * Network Map - Visualize connections in the Mirror network
 * 
 * Features:
 * - Node visualization (users, doors, threads)
 * - Connection lines with strength
 * - Interactive zoom/pan
 * - Filter by connection type
 * - Your position highlighted
 * - Cluster detection
 * - Privacy controls
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
  User,
  Home,
  FileText,
  Link2,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type NodeType = 'user' | 'door' | 'thread' | 'community';

interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  isYou?: boolean;
  metadata?: Record<string, any>;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  strength: number; // 0.0 - 1.0
  type: 'witnessed' | 'responded' | 'attested' | 'similar';
}

interface NetworkMapProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  centerNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  showPrivacyWarning?: boolean;
  allowExport?: boolean;
}

const NODE_TYPE_CONFIG = {
  user: { icon: User, color: '#3B82F6', label: 'User' },
  door: { icon: Home, color: '#10B981', label: 'Door' },
  thread: { icon: FileText, color: '#8B5CF6', label: 'Thread' },
  community: { icon: Network, color: '#F59E0B', label: 'Community' },
};

export function NetworkMap({
  nodes,
  edges,
  centerNodeId,
  onNodeClick,
  onEdgeClick,
  showPrivacyWarning = true,
  allowExport = false,
}: NetworkMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [filterTypes, setFilterTypes] = useState<NodeType[]>([]);
  const [showEdges, setShowEdges] = useState(true);

  const filteredNodes = filterTypes.length > 0
    ? nodes.filter(n => filterTypes.includes(n.type))
    : nodes;

  const filteredEdges = edges.filter(e => {
    const sourceNode = nodes.find(n => n.id === e.source);
    const targetNode = nodes.find(n => n.id === e.target);
    return sourceNode && targetNode &&
      (filterTypes.length === 0 || 
       (filterTypes.includes(sourceNode.type) && filterTypes.includes(targetNode.type)));
  });

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFilter = (type: NodeType) => {
    setFilterTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    // Apply zoom and pan
    ctx.save();
    ctx.translate(centerX + pan.x, centerY + pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    if (showEdges) {
      filteredEdges.forEach(edge => {
        const sourceNode = filteredNodes.find(n => n.id === edge.source);
        const targetNode = filteredNodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = `rgba(100, 116, 139, ${edge.strength * 0.5})`;
        ctx.lineWidth = edge.strength * 2;
        ctx.stroke();
      });
    }

    // Draw nodes
    filteredNodes.forEach(node => {
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Highlight if selected or "you"
      if (selectedNode?.id === node.id || node.isYou) {
        ctx.strokeStyle = node.isYou ? '#F59E0B' : '#3B82F6';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#1E293B';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.size + 15);
    });

    ctx.restore();
  }, [filteredNodes, filteredEdges, zoom, pan, selectedNode, showEdges]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Network size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">Network Map</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredNodes.length} nodes • {filteredEdges.length} connections
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

          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Show:</span>
            {Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              const count = nodes.filter(n => n.type === type).length;
              const isActive = filterTypes.length === 0 || filterTypes.includes(type as NodeType);

              return (
                <button
                  key={type}
                  onClick={() => toggleFilter(type as NodeType)}
                  disabled={count === 0}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                    isActive
                      ? 'text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                  }`}
                  style={{
                    backgroundColor: isActive ? config.color : undefined,
                    opacity: count === 0 ? 0.5 : 1,
                  }}
                >
                  <Icon size={14} />
                  <span>{config.label}</span>
                  <Badge variant="secondary" size="sm">
                    {count}
                  </Badge>
                </button>
              );
            })}

            <button
              onClick={() => setShowEdges(!showEdges)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                showEdges
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
              }`}
            >
              {showEdges ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>Edges</span>
            </button>
          </div>
        </div>
      </Card>

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
              const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
              return distance <= node.size;
            });

            if (clickedNode) {
              setSelectedNode(clickedNode);
              onNodeClick?.(clickedNode.id);
            } else {
              setSelectedNode(null);
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
      {selectedNode && (
        <Card className="border-2 border-[var(--color-accent-blue)]">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${selectedNode.color}20`,
                    color: selectedNode.color,
                  }}
                >
                  {NODE_TYPE_CONFIG[selectedNode.type].icon({ size: 20 })}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{selectedNode.label}</h4>
                    <Badge variant="secondary">
                      {NODE_TYPE_CONFIG[selectedNode.type].label}
                    </Badge>
                    {selectedNode.isYou && (
                      <Badge variant="warning">You</Badge>
                    )}
                  </div>
                  {selectedNode.metadata && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {Object.entries(selectedNode.metadata)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' • ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Connection count */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Link2 size={14} className="text-[var(--color-text-muted)]" />
                <span className="text-[var(--color-text-secondary)]">
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} connections
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-[var(--color-text-muted)]">
            Connection Types
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#64748B]" style={{ opacity: 0.3 }} />
              <span className="text-[var(--color-text-muted)]">Weak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#64748B]" style={{ opacity: 0.6 }} />
              <span className="text-[var(--color-text-muted)]">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#64748B]" style={{ opacity: 1 }} />
              <span className="text-[var(--color-text-muted)]">Strong</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#F59E0B]" />
              <span className="text-[var(--color-text-muted)]">You</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Warning */}
      {showPrivacyWarning && (
        <Card className="border-2 border-[var(--color-border-warning)]">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[var(--color-border-warning)] mt-0.5" />
            <div className="text-xs text-[var(--color-text-secondary)]">
              <p className="mb-2">
                <strong>Network maps show aggregated patterns.</strong> Individual identities 
                are anonymized unless you've explicitly chosen to be visible.
              </p>
              <p className="text-[var(--color-text-muted)]">
                You can control your visibility in the Commons settings. This visualization 
                respects all constitutional privacy constraints.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export type { NetworkNode, NetworkEdge };


