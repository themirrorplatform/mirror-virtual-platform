import { motion, AnimatePresence } from 'motion/react';
import { User, Eye, EyeOff, Edit3, Link2, Trash2, Info, AlertCircle, X, Search, Filter, Download, ZoomIn, ZoomOut, Maximize2, RefreshCw, Grid, GitBranch } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Layer } from './LayerHUD';

interface IdentityNode {
  id: string;
  label: string;
  origin: 'user' | 'system' | 'commons';
  learningEnabled: boolean;
  confidence: number; // 0-1 (rendered as opacity)
  connectedNodes: string[];
  reflectionCount: number;
  mirrorbackUsageCount: number;
  createdAt: string;
  tags?: string[];
  privacyBoundary?: 'private' | 'commons' | 'public';
}

interface IdentityGraphInstrumentProps {
  layer: Layer;
  nodes: IdentityNode[];
  mode: 'overlay' | 'full' | 'node-detail';
  selectedNodeId?: string;
  onFocusNode: (nodeId: string) => void;
  onEditNode: (nodeId: string, newLabel: string) => void;
  onToggleLearning: (nodeId: string, enabled: boolean) => void;
  onLinkNodes: (nodeA: string, nodeB: string) => void;
  onUnlinkNodes?: (nodeA: string, nodeB: string) => void;
  onMergeNodes?: (nodeA: string, nodeB: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onExportGraph?: (format: 'json' | 'png') => void;
  onClose: () => void;
}

const originConfig = {
  user: { color: 'var(--color-accent-gold)', label: 'User-defined', icon: User },
  system: { color: 'var(--color-accent-blue)', label: 'System-inferred', icon: Grid },
  commons: { color: 'var(--color-accent-purple)', label: 'Commons-derived', icon: GitBranch }
};

const privacyConfig = {
  private: { color: 'var(--color-error)', label: 'Private', icon: Eye },
  commons: { color: 'var(--color-warning)', label: 'Commons', icon: GitBranch },
  public: { color: 'var(--color-success)', label: 'Public', icon: Eye }
};

export function IdentityGraphInstrument({
  layer,
  nodes,
  mode,
  selectedNodeId,
  onFocusNode,
  onEditNode,
  onToggleLearning,
  onLinkNodes,
  onUnlinkNodes,
  onMergeNodes,
  onDeleteNode,
  onExportGraph,
  onClose
}: IdentityGraphInstrumentProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [linkMode, setLinkMode] = useState(false);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [filterLearning, setFilterLearning] = useState<string>('all');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showClusters, setShowClusters] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const filteredNodes = nodes.filter(node => {
    if (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterOrigin !== 'all' && node.origin !== filterOrigin) return false;
    if (filterLearning === 'enabled' && !node.learningEnabled) return false;
    if (filterLearning === 'disabled' && node.learningEnabled) return false;
    return true;
  });

  const startEdit = (node: IdentityNode) => {
    setEditingNodeId(node.id);
    setEditLabel(node.label);
  };

  const saveEdit = (nodeId: string) => {
    if (editLabel.trim()) {
      onEditNode(nodeId, editLabel.trim());
    }
    setEditingNodeId(null);
  };

  const handleNodeClick = (nodeId: string) => {
    if (linkMode) {
      if (!linkSource) {
        setLinkSource(nodeId);
      } else if (linkSource !== nodeId) {
        onLinkNodes(linkSource, nodeId);
        setLinkMode(false);
        setLinkSource(null);
      }
    } else {
      onFocusNode(nodeId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !linkMode) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calculate node positions using force-directed layout simulation
  const getNodePositions = () => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const centerX = 400;
    const centerY = 300;

    if (showClusters) {
      // Cluster by origin
      const clusters = { user: [], system: [], commons: [] } as any;
      filteredNodes.forEach(node => clusters[node.origin].push(node));

      Object.keys(clusters).forEach((origin, clusterIndex) => {
        const clusterAngle = (clusterIndex / 3) * Math.PI * 2;
        const clusterRadius = 200;
        const clusterX = centerX + Math.cos(clusterAngle) * clusterRadius;
        const clusterY = centerY + Math.sin(clusterAngle) * clusterRadius;

        clusters[origin].forEach((node: IdentityNode, i: number) => {
          const angle = (i / clusters[origin].length) * Math.PI * 2;
          const radius = 80;
          positions[node.id] = {
            x: clusterX + Math.cos(angle) * radius,
            y: clusterY + Math.sin(angle) * radius
          };
        });
      });
    } else {
      // Circular layout
      filteredNodes.forEach((node, i) => {
        const angle = (i / filteredNodes.length) * Math.PI * 2;
        const radius = Math.min(250, 100 + filteredNodes.length * 10);
        positions[node.id] = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        };
      });
    }

    return positions;
  };

  const nodePositions = getNodePositions();

  const totalReflections = nodes.reduce((sum, n) => sum + n.reflectionCount, 0);
  const totalMirrorbacks = nodes.reduce((sum, n) => sum + n.mirrorbackUsageCount, 0);
  const learningEnabledCount = nodes.filter(n => n.learningEnabled).length;

  // Overlay mode (translucent, minimal)
  if (mode === 'overlay') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 backdrop-blur-sm" />
        
        {/* Simplified node visualization */}
        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
          <div className="relative w-full max-w-4xl aspect-video">
            {nodes.slice(0, 12).map((node, i) => {
              const angle = (i / Math.min(nodes.length, 12)) * Math.PI * 2;
              const radius = 200;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: node.confidence * 0.8,
                    scale: 1,
                    x: `calc(50% + ${x}px)`,
                    y: `calc(50% + ${y}px)`
                  }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
                  onClick={() => onFocusNode(node.id)}
                >
                  <div 
                    className="px-3 py-2 rounded-xl border backdrop-blur-xl"
                    style={{
                      backgroundColor: `${originConfig[node.origin].color}20`,
                      borderColor: `${originConfig[node.origin].color}40`
                    }}
                  >
                    <div className="text-xs text-white/90">{node.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // Node detail mode
  if (mode === 'node-detail' && selectedNode) {
    const config = originConfig[selectedNode.origin];
    const OriginIcon = config.icon;
    const connectedNodeObjects = nodes.filter(n => selectedNode.connectedNodes.includes(n.id));

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 bottom-0 w-96 bg-[var(--color-surface-card)] border-l border-[var(--color-border-subtle)] shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${config.color}20` }}>
                <OriginIcon size={20} style={{ color: config.color }} />
              </div>
              <div className="flex-1">
                {editingNodeId === selectedNode.id ? (
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => saveEdit(selectedNode.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(selectedNode.id);
                      if (e.key === 'Escape') setEditingNodeId(null);
                    }}
                    className="w-full px-2 py-1 rounded bg-[var(--color-surface-emphasis)] border border-[var(--color-accent-gold)] text-[var(--color-text-primary)] focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl text-[var(--color-text-primary)] mb-1">{selectedNode.label}</h2>
                )}
                <p className="text-sm" style={{ color: config.color }}>{config.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
            >
              <X size={16} className="text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Confidence */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-text-muted)]">Confidence</span>
              <span className="text-sm font-bold" style={{ color: config.color }}>
                {Math.round(selectedNode.confidence * 100)}%
              </span>
            </div>
            <div className="h-2 bg-[var(--color-surface-emphasis)] rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: config.color }}
                initial={{ width: 0 }}
                animate={{ width: `${selectedNode.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Privacy Boundary */}
          {selectedNode.privacyBoundary && (
            <div className="mb-6 p-4 rounded-2xl border border-[var(--color-border-subtle)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Privacy Boundary</div>
              <div className="flex items-center gap-2">
                {React.createElement(privacyConfig[selectedNode.privacyBoundary].icon, {
                  size: 14,
                  style: { color: privacyConfig[selectedNode.privacyBoundary].color }
                })}
                <span className="text-sm" style={{ color: privacyConfig[selectedNode.privacyBoundary].color }}>
                  {privacyConfig[selectedNode.privacyBoundary].label}
                </span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Reflections</div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {selectedNode.reflectionCount}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Mirrorbacks</div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {selectedNode.mirrorbackUsageCount}
              </div>
            </div>
          </div>

          {/* Learning Toggle */}
          <div className="mb-6 p-4 rounded-2xl border border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedNode.learningEnabled ? (
                  <Eye size={16} className="text-[var(--color-success)]" />
                ) : (
                  <EyeOff size={16} className="text-[var(--color-text-muted)]" />
                )}
                <div>
                  <div className="text-sm text-[var(--color-text-primary)]">
                    Learning {selectedNode.learningEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {selectedNode.learningEnabled 
                      ? 'Mirrorbacks may reference this aspect'
                      : 'Mirrorbacks will not reference this aspect'
                    }
                  </div>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={selectedNode.learningEnabled}
                  onChange={(e) => onToggleLearning(selectedNode.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-[var(--color-surface-emphasis)] peer-checked:bg-[var(--color-success)] rounded-full transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
              </label>
            </div>
          </div>

          {/* Connected Nodes */}
          {connectedNodeObjects.length > 0 && (
            <div className="mb-6">
              <div className="text-sm text-[var(--color-text-primary)] mb-3">
                Connected Nodes ({connectedNodeObjects.length})
              </div>
              <div className="space-y-2">
                {connectedNodeObjects.map(node => {
                  const nodeConfig = originConfig[node.origin];
                  const NodeIcon = nodeConfig.icon;

                  return (
                    <button
                      key={node.id}
                      onClick={() => onFocusNode(node.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] transition-colors"
                    >
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${nodeConfig.color}20` }}>
                        <NodeIcon size={14} style={{ color: nodeConfig.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm text-[var(--color-text-primary)]">{node.label}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{nodeConfig.label}</div>
                      </div>
                      {onUnlinkNodes && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlinkNodes(selectedNode.id, node.id);
                          }}
                          className="p-1 rounded hover:bg-[var(--color-error)]/20 transition-colors"
                          title="Unlink"
                        >
                          <X size={12} className="text-[var(--color-error)]" />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mb-6 p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
            <div className="text-xs text-[var(--color-text-muted)] mb-2">Created</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {new Date(selectedNode.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => startEdit(selectedNode)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors flex items-center gap-2"
            >
              <Edit3 size={14} />
              <span>Edit Label</span>
            </button>

            {onMergeNodes && (
              <button
                onClick={() => {
                  // Would trigger merge node selector
                }}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors flex items-center gap-2"
              >
                <GitBranch size={14} />
                <span>Merge with Another Node</span>
              </button>
            )}

            {onDeleteNode && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${selectedNode.label}"? This cannot be undone.`)) {
                    onDeleteNode(selectedNode.id);
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-error)]/10 hover:bg-[var(--color-error)]/20 text-[var(--color-error)] text-sm transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Delete Node</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Full mode - Interactive graph
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-7xl max-h-[90vh] bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Identity graph"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl text-[var(--color-text-primary)] mb-2">Identity Graph</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {nodes.length} aspects • {totalReflections} reflections • {layer} layer
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
              aria-label="Close"
            >
              <X size={16} className="text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)]">Total Nodes</div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{nodes.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)]">Learning Enabled</div>
              <div className="text-2xl font-bold text-[var(--color-success)]">{learningEnabledCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)]">Reflections</div>
              <div className="text-2xl font-bold text-[var(--color-accent-gold)]">{totalReflections}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)]">Mirrorbacks</div>
              <div className="text-2xl font-bold text-[var(--color-accent-purple)]">{totalMirrorbacks}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)]"
              />
            </div>

            <select
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
              <option value="all">All Origins</option>
              <option value="user">User-defined</option>
              <option value="system">System-inferred</option>
              <option value="commons">Commons-derived</option>
            </select>

            <select
              value={filterLearning}
              onChange={(e) => setFilterLearning(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
              <option value="all">All Nodes</option>
              <option value="enabled">Learning Enabled</option>
              <option value="disabled">Learning Disabled</option>
            </select>

            <button
              onClick={() => setShowClusters(!showClusters)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                showClusters
                  ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
              }`}
              title="Toggle clustering"
            >
              <Grid size={14} />
            </button>

            <button
              onClick={() => setLinkMode(!linkMode)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                linkMode
                  ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
              }`}
              title="Link mode"
            >
              <Link2 size={14} />
            </button>

            {onExportGraph && (
              <button
                onClick={() => onExportGraph('json')}
                className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] text-sm transition-colors"
                title="Export graph"
              >
                <Download size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Graph Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-[var(--color-surface-emphasis)] cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className="absolute inset-0 transition-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
            }}
          >
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {filteredNodes.map(node => 
                node.connectedNodes
                  .filter(connId => filteredNodes.some(n => n.id === connId))
                  .map(connId => {
                    const connNode = nodes.find(n => n.id === connId);
                    if (!connNode || !nodePositions[node.id] || !nodePositions[connId]) return null;

                    const start = nodePositions[node.id];
                    const end = nodePositions[connId];

                    return (
                      <line
                        key={`${node.id}-${connId}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="var(--color-border-subtle)"
                        strokeWidth="2"
                        strokeOpacity={0.3}
                      />
                    );
                  })
              )}
            </svg>

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const config = originConfig[node.origin];
              const NodeIcon = config.icon;
              const position = nodePositions[node.id];
              if (!position) return null;

              const isSelected = selectedNodeId === node.id;
              const isLinkSource = linkSource === node.id;
              const isHovered = hoveredNode === node.id;

              return (
                <motion.div
                  key={node.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: position.x,
                    top: position.y,
                    opacity: node.confidence,
                    zIndex: isSelected || isHovered ? 10 : 1
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: node.confidence }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div
                    className={`p-3 rounded-2xl border-2 backdrop-blur-sm transition-all ${
                      isSelected
                        ? 'border-[var(--color-accent-gold)] shadow-lg'
                        : isLinkSource
                        ? 'border-[var(--color-accent-blue)] shadow-lg'
                        : 'border-transparent hover:border-[var(--color-border-emphasis)]'
                    }`}
                    style={{
                      backgroundColor: `${config.color}${isSelected || isHovered ? '30' : '20'}`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <NodeIcon size={16} style={{ color: config.color }} />
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {node.label}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {node.reflectionCount} reflections
                        </div>
                      </div>
                      {!node.learningEnabled && (
                        <EyeOff size={12} className="text-[var(--color-text-muted)]" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => handleZoom(0.1)}
              className="p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={16} className="text-[var(--color-text-muted)]" />
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={16} className="text-[var(--color-text-muted)]" />
            </button>
            <button
              onClick={resetView}
              className="p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors"
              title="Reset view"
            >
              <RefreshCw size={16} className="text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Link Mode Indicator */}
          {linkMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-[var(--color-accent-blue)]/20 border border-[var(--color-accent-blue)]/40 text-[var(--color-accent-blue)] text-sm backdrop-blur-sm">
              {linkSource ? 'Select target node to link' : 'Select source node'}
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 left-4 p-4 rounded-xl bg-[var(--color-surface-card)]/80 border border-[var(--color-border-subtle)] backdrop-blur-sm">
            <div className="text-xs text-[var(--color-text-muted)] mb-2">Origin</div>
            <div className="space-y-2">
              {Object.entries(originConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon size={12} style={{ color: config.color }} />
                    <span className="text-xs text-[var(--color-text-secondary)]">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
          <div className="text-xs text-[var(--color-text-muted)]">
            Drag to pan • Scroll to zoom • Click to select • {linkMode ? 'Link mode active' : 'Click link button to connect nodes'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
