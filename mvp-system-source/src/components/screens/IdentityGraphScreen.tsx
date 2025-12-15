import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Eye, Edit3, Clock, User, Zap, Shield, Globe, Lock, X } from 'lucide-react';

// Identity node types
type NodeOrigin = 'user' | 'inferred' | 'commons';
type NodeLayer = 'emotional' | 'narrative' | 'behavioral' | 'temporal';

interface IdentityNode {
  id: string;
  label: string;
  origin: NodeOrigin;
  layer: NodeLayer;
  learningEnabled: boolean;
  commonsShared: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  lastModified: string;
  modificationSource: string;
  reflectionCount: number;
}

interface IdentityEdge {
  id: string;
  source: string;
  target: string;
  type: 'tension' | 'pattern' | 'contradiction' | 'support';
  strength: number;
  label: string;
  firstSeen: string;
  lastSeen: string;
}

type ViewMode = 'observational' | 'interpretive' | 'builder';

// Mock identity data (moved outside component to prevent re-creation)
const initialNodes: IdentityNode[] = [
  {
    id: 'n1',
    label: 'The Achiever',
    origin: 'user',
    layer: 'narrative',
    learningEnabled: true,
    commonsShared: false,
    reflectionCount: 23,
    lastModified: '2 days ago',
    modificationSource: 'User explicit naming',
  },
  {
    id: 'n2',
    label: 'The Anxious Planner',
    origin: 'inferred',
    layer: 'emotional',
    learningEnabled: true,
    commonsShared: true,
    reflectionCount: 18,
    lastModified: '5 hours ago',
    modificationSource: 'Local pattern detection',
  },
  {
    id: 'n3',
    label: 'The Skeptic',
    origin: 'user',
    layer: 'behavioral',
    learningEnabled: false,
    commonsShared: false,
    reflectionCount: 12,
    lastModified: '1 week ago',
    modificationSource: 'User explicit naming',
  },
  {
    id: 'n4',
    label: 'The Optimist',
    origin: 'inferred',
    layer: 'emotional',
    learningEnabled: true,
    commonsShared: true,
    reflectionCount: 31,
    lastModified: '1 day ago',
    modificationSource: 'Local pattern detection',
  },
  {
    id: 'n5',
    label: 'The Caregiver',
    origin: 'commons',
    layer: 'narrative',
    learningEnabled: true,
    commonsShared: true,
    reflectionCount: 8,
    lastModified: '3 days ago',
    modificationSource: 'Commons pattern suggestion',
  },
  {
    id: 'n6',
    label: 'Morning Self',
    origin: 'inferred',
    layer: 'temporal',
    learningEnabled: true,
    commonsShared: false,
    reflectionCount: 45,
    lastModified: '12 hours ago',
    modificationSource: 'Local temporal analysis',
  },
  {
    id: 'n7',
    label: 'The Perfectionist',
    origin: 'user',
    layer: 'behavioral',
    learningEnabled: true,
    commonsShared: false,
    reflectionCount: 27,
    lastModified: '4 days ago',
    modificationSource: 'User explicit naming',
  },
];

const edges: IdentityEdge[] = [
  {
    id: 'e1',
    source: 'n1',
    target: 'n2',
    type: 'tension',
    strength: 0.8,
    label: 'Achievement anxiety cycle',
    firstSeen: '3 weeks ago',
    lastSeen: '2 days ago',
  },
  {
    id: 'e2',
    source: 'n3',
    target: 'n4',
    type: 'contradiction',
    strength: 0.9,
    label: 'Hope vs. doubt oscillation',
    firstSeen: '2 weeks ago',
    lastSeen: '1 day ago',
  },
  {
    id: 'e3',
    source: 'n1',
    target: 'n7',
    type: 'pattern',
    strength: 0.7,
    label: 'High standards feedback loop',
    firstSeen: '1 month ago',
    lastSeen: '4 days ago',
  },
  {
    id: 'e4',
    source: 'n5',
    target: 'n1',
    type: 'tension',
    strength: 0.6,
    label: 'Self-care vs. productivity',
    firstSeen: '2 weeks ago',
    lastSeen: '3 days ago',
  },
  {
    id: 'e5',
    source: 'n4',
    target: 'n6',
    type: 'support',
    strength: 0.5,
    label: 'Morning energy alignment',
    firstSeen: '3 weeks ago',
    lastSeen: '12 hours ago',
  },
  {
    id: 'e6',
    source: 'n2',
    target: 'n7',
    type: 'pattern',
    strength: 0.75,
    label: 'Anxiety fuels perfectionism',
    firstSeen: '1 month ago',
    lastSeen: '5 hours ago',
  },
];

export function IdentityGraphScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('observational');
  const [selectedNode, setSelectedNode] = useState<IdentityNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<IdentityEdge | null>(null);
  const [activeLayer, setActiveLayer] = useState<NodeLayer | 'all'>('all');
  const [timePoint, setTimePoint] = useState(100);
  const [nodes, setNodes] = useState<IdentityNode[]>(initialNodes);
  const [nodeCardPosition, setNodeCardPosition] = useState<{ x: number; y: number } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<IdentityNode[]>(initialNodes);

  // Initialize node positions once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize positions in a circle
    const initializedNodes = initialNodes.map((node, i) => ({
      ...node,
      x: centerX + Math.cos((i / initialNodes.length) * Math.PI * 2) * 200,
      y: centerY + Math.sin((i / initialNodes.length) * Math.PI * 2) * 200,
      vx: 0,
      vy: 0,
    }));
    
    nodesRef.current = initializedNodes;
    setNodes(initializedNodes);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Apply forces to nodes stored in ref
      const currentNodes = nodesRef.current;
      
      // Repulsion between nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n1 = currentNodes[i];
          const n2 = currentNodes[j];
          if (!n1.x || !n1.y || !n2.x || !n2.y) continue;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 5000 / (dist * dist);

          n1.vx = (n1.vx || 0) - (dx / dist) * force;
          n1.vy = (n1.vy || 0) - (dy / dist) * force;
          n2.vx = (n2.vx || 0) + (dx / dist) * force;
          n2.vy = (n2.vy || 0) + (dy / dist) * force;
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const source = currentNodes.find(n => n.id === edge.source);
        const target = currentNodes.find(n => n.id === edge.target);
        if (!source || !target || !source.x || !source.y || !target.x || !target.y) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 150) * 0.01 * edge.strength;

        source.vx = (source.vx || 0) + (dx / dist) * force;
        source.vy = (source.vy || 0) + (dy / dist) * force;
        target.vx = (target.vx || 0) - (dx / dist) * force;
        target.vy = (target.vy || 0) - (dy / dist) * force;
      });

      // Center gravity
      currentNodes.forEach(node => {
        if (!node.x || !node.y) return;
        const dx = width / 2 - node.x;
        const dy = height / 2 - node.y;
        node.vx = (node.vx || 0) + dx * 0.001;
        node.vy = (node.vy || 0) + dy * 0.001;
      });

      // Update positions with damping
      currentNodes.forEach(node => {
        if (!node.x || !node.y || !node.vx || !node.vy) return;
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;
      });

      // Draw edges
      edges.forEach(edge => {
        const source = currentNodes.find(n => n.id === edge.source);
        const target = currentNodes.find(n => n.id === edge.target);
        if (!source || !target || !source.x || !source.y || !target.x || !target.y) return;

        // Filter by active layer
        if (activeLayer !== 'all' && source.layer !== activeLayer && target.layer !== activeLayer) return;

        ctx.strokeStyle = edge.type === 'tension' ? '#F37373' 
          : edge.type === 'contradiction' ? '#F5C16A'
          : edge.type === 'support' ? '#7AD4A8'
          : '#7AB7FF';
        ctx.lineWidth = edge.strength * 2;
        ctx.globalAlpha = 0.3 + edge.strength * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw nodes
      currentNodes.forEach(node => {
        if (!node.x || !node.y) return;

        // Filter by active layer
        if (activeLayer !== 'all' && node.layer !== activeLayer) {
          ctx.globalAlpha = 0.2;
        }

        const isSelected = selectedNode?.id === node.id;
        const radius = isSelected ? 28 : 24;

        // Node circle
        ctx.fillStyle = node.origin === 'user' ? '#F3D28C'
          : node.origin === 'commons' ? '#7AD4A8'
          : '#7AB7FF';
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Selection ring
        if (isSelected) {
          ctx.strokeStyle = '#F3D28C';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Learning lock indicator
        if (!node.learningEnabled) {
          ctx.fillStyle = '#F37373';
          ctx.beginPath();
          ctx.arc(node.x + 16, node.y - 16, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedNode, activeLayer]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a node
    const clickedNode = nodesRef.current.find(node => {
      if (!node.x || !node.y) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 24;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setSelectedEdge(null);
      setNodeCardPosition({ x, y });
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
      setNodeCardPosition(null);
    }
  };

  const toggleNodeLearning = (nodeId: string) => {
    const updatedNodes = nodesRef.current.map(node =>
      node.id === nodeId ? { ...node, learningEnabled: !node.learningEnabled } : node
    );
    nodesRef.current = updatedNodes;
    setNodes(updatedNodes);
    
    // Update selected node if it's the one being toggled
    if (selectedNode?.id === nodeId) {
      setSelectedNode(updatedNodes.find(n => n.id === nodeId) || null);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-base-default)]">
      {/* Main Graph Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mb-1">Identity Graph</h1>
              <p className="text-[var(--color-text-secondary)]">
                {viewMode === 'observational' && 'What your Mirror has perceived'}
                {viewMode === 'interpretive' && 'Patterns and themes highlighted'}
                {viewMode === 'builder' && 'Manual graph editing mode'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'observational' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('observational')}
              >
                <Eye size={16} className="mr-2" />
                Observe
              </Button>
              <Button
                variant={viewMode === 'interpretive' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('interpretive')}
              >
                <Zap size={16} className="mr-2" />
                Interpret
              </Button>
              <Button
                variant={viewMode === 'builder' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('builder')}
              >
                <Edit3 size={16} className="mr-2" />
                Build
              </Button>
            </div>
          </div>

          {/* Layer filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeLayer === 'all'
                  ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                  : 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              All Layers
            </button>
            <button
              onClick={() => setActiveLayer('emotional')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeLayer === 'emotional'
                  ? 'bg-[var(--color-accent-red)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Emotional
            </button>
            <button
              onClick={() => setActiveLayer('narrative')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeLayer === 'narrative'
                  ? 'bg-[var(--color-accent-blue)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Narrative
            </button>
            <button
              onClick={() => setActiveLayer('behavioral')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeLayer === 'behavioral'
                  ? 'bg-[var(--color-accent-purple)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Behavioral
            </button>
            <button
              onClick={() => setActiveLayer('temporal')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeLayer === 'temporal'
                  ? 'bg-[var(--color-accent-green)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Temporal
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={1200}
            height={700}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer"
          />

          {/* Legend */}
          <div className="absolute bottom-6 left-6 p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <div className="text-sm mb-3 text-[var(--color-text-secondary)]">Origin</div>
            <div className="space-y-2">
              <LegendItem color="#F3D28C" label="User-named" icon={<User size={12} />} />
              <LegendItem color="#7AB7FF" label="Inferred" icon={<Zap size={12} />} />
              <LegendItem color="#7AD4A8" label="Commons" icon={<Globe size={12} />} />
            </div>
            <div className="text-sm mb-2 mt-4 text-[var(--color-text-secondary)]">Connections</div>
            <div className="space-y-2">
              <LegendItem color="#F37373" label="Tension" />
              <LegendItem color="#F5C16A" label="Contradiction" />
              <LegendItem color="#7AD4A8" label="Support" />
              <LegendItem color="#7AB7FF" label="Pattern" />
            </div>
          </div>

          {/* Floating Node Card */}
          <AnimatePresence>
            {selectedNode && nodeCardPosition && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="absolute pointer-events-none"
                style={{
                  left: `${nodeCardPosition.x}px`,
                  top: `${nodeCardPosition.y}px`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="w-80 p-4 rounded-xl bg-[var(--color-surface-card)] border-2 border-[var(--color-accent-gold)] shadow-2xl pointer-events-auto">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm">{selectedNode.label}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            selectedNode.origin === 'user'
                              ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                              : selectedNode.origin === 'commons'
                              ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                              : 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                          }`}
                        >
                          {selectedNode.origin === 'user' ? 'User' : selectedNode.origin === 'commons' ? 'Commons' : 'Inferred'}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mb-2">
                        {selectedNode.layer.charAt(0).toUpperCase() + selectedNode.layer.slice(1)} layer
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedNode(null);
                        setNodeCardPosition(null);
                      }}
                      className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <X size={16} className="text-[var(--color-text-muted)]" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">Reflections</span>
                      <span className="text-[var(--color-text-primary)]">{selectedNode.reflectionCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">Last modified</span>
                      <span className="text-[var(--color-text-primary)]">{selectedNode.lastModified}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-3 text-xs">
                      <div className={`flex items-center gap-1 ${selectedNode.learningEnabled ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                        {selectedNode.learningEnabled ? <Zap size={12} /> : <Lock size={12} />}
                        <span>{selectedNode.learningEnabled ? 'Learning' : 'Locked'}</span>
                      </div>
                      {selectedNode.commonsShared && (
                        <div className="flex items-center gap-1 text-[var(--color-accent-green)]">
                          <Shield size={12} />
                          <span>Shared</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} connections
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time Scrubber */}
        <div className="p-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-4">
            <Clock size={20} className="text-[var(--color-text-muted)]" />
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={timePoint}
                onChange={e => setTimePoint(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                <span>3 months ago</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Node/Edge Inspector */}
      <div className="w-96 border-l border-[var(--color-border-subtle)] bg-[var(--color-base-raised)] overflow-y-auto">
        {selectedNode ? (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h3>{selectedNode.label}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    selectedNode.origin === 'user'
                      ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                      : selectedNode.origin === 'commons'
                      ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                      : 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                  }`}
                >
                  {selectedNode.origin === 'user' ? 'User' : selectedNode.origin === 'commons' ? 'Commons' : 'Inferred'}
                </span>
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">
                {selectedNode.layer.charAt(0).toUpperCase() + selectedNode.layer.slice(1)} layer
              </div>
            </div>

            <div className="space-y-4">
              <Card variant="subtle">
                <div className="space-y-3">
                  <InfoRow label="Reflection count" value={selectedNode.reflectionCount.toString()} />
                  <InfoRow label="Last modified" value={selectedNode.lastModified} />
                  <InfoRow label="Modified by" value={selectedNode.modificationSource} />
                </div>
              </Card>

              {/* Learning Control */}
              <Card variant="subtle">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm mb-1">Learning Permission</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Allow Mirror to learn from this identity
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNodeLearning(selectedNode.id)}
                    className={`p-2 rounded ${
                      selectedNode.learningEnabled
                        ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                        : 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]'
                    }`}
                  >
                    {selectedNode.learningEnabled ? <Zap size={16} /> : <Lock size={16} />}
                  </button>
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {selectedNode.learningEnabled
                    ? 'This identity contributes to your Mirror{"\u2019"}s understanding'
                    : 'This identity is observed but excluded from learning'}
                </div>
              </Card>

              {/* Commons Sharing */}
              <Card variant="subtle">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm mb-1">Commons Sharing</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Contribute anonymized patterns
                    </div>
                  </div>
                  <Shield
                    size={16}
                    className={
                      selectedNode.commonsShared
                        ? 'text-[var(--color-accent-green)]'
                        : 'text-[var(--color-text-muted)]'
                    }
                  />
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {selectedNode.commonsShared
                    ? 'Pattern shared with Commons (no personal data)'
                    : 'Not shared with Commons'}
                </div>
              </Card>

              {viewMode === 'builder' && (
                <div className="space-y-2">
                  <Button variant="secondary" size="sm" className="w-full">
                    Rename Identity
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    Change Layer
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-[var(--color-accent-red)]">
                    Remove Identity
                  </Button>
                </div>
              )}
            </div>

            {/* Connected identities */}
            <div className="mt-6">
              <div className="text-sm mb-3 text-[var(--color-text-secondary)]">Connections</div>
              <div className="space-y-2">
                {edges
                  .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map(edge => {
                    const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                    const otherNode = nodes.find(n => n.id === otherId);
                    return (
                      <button
                        key={edge.id}
                        onClick={() => setSelectedEdge(edge)}
                        className="w-full p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{otherNode?.label}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              edge.type === 'tension'
                                ? 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]'
                                : edge.type === 'contradiction'
                                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                                : edge.type === 'support'
                                ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                                : 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                            }`}
                          >
                            {edge.type}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)]">{edge.label}</div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center py-16">
              <User size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
              <p className="text-[var(--color-text-muted)] mb-2">No identity selected</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Click a node to inspect its origin, connections, and permissions
              </p>
            </div>

            {/* Graph statistics */}
            <Card variant="subtle">
              <div className="text-sm mb-3 text-[var(--color-text-secondary)]">Graph Statistics</div>
              <div className="space-y-2">
                <InfoRow label="Total identities" value={nodes.length.toString()} />
                <InfoRow label="User-named" value={nodes.filter(n => n.origin === 'user').length.toString()} />
                <InfoRow label="Inferred" value={nodes.filter(n => n.origin === 'inferred').length.toString()} />
                <InfoRow label="Commons" value={nodes.filter(n => n.origin === 'commons').length.toString()} />
                <InfoRow label="Connections" value={edges.length.toString()} />
                <InfoRow label="Learning enabled" value={nodes.filter(n => n.learningEnabled).length.toString()} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label, icon }: { color: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {icon ? (
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
          {icon}
        </div>
      ) : (
        <div className="w-4 h-1 rounded" style={{ backgroundColor: color }} />
      )}
      <span className="text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}