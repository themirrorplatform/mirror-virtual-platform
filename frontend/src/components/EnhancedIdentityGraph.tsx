/**
 * Enhanced Identity Graph - Interactive visualization
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: 'belief' | 'tension' | 'goal' | 'pattern';
  x: number;
  y: number;
  connections: string[];
}

export function EnhancedIdentityGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Sample data - in real app, this would come from backend
  const nodes: Node[] = [
    { id: '1', label: 'Perfectionism', type: 'tension', x: 50, y: 30, connections: ['2', '4'] },
    { id: '2', label: 'Creative Expression', type: 'goal', x: 80, y: 30, connections: ['1', '3'] },
    { id: '3', label: 'Self-Criticism', type: 'pattern', x: 80, y: 60, connections: ['2', '4'] },
    { id: '4', label: 'Growth Mindset', type: 'belief', x: 50, y: 60, connections: ['1', '3'] },
    { id: '5', label: 'Authenticity', type: 'goal', x: 35, y: 45, connections: ['1', '4'] },
    { id: '6', label: 'Fear of Judgment', type: 'tension', x: 65, y: 45, connections: ['2', '3'] },
  ];

  const getNodeColor = (type: Node['type']) => {
    const colors = {
      belief: '#10B981',
      tension: '#EF4444',
      goal: '#3B82F6',
      pattern: '#F59E0B',
    };
    return colors[type];
  };

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'belief':
        return <Sparkles size={16} />;
      case 'goal':
        return <TrendingUp size={16} />;
      case 'tension':
        return <AlertTriangle size={16} />;
      default:
        return <Network size={16} />;
    }
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="h-full flex">
      {/* Graph Canvas */}
      <div className="flex-1 relative bg-gradient-to-br from-[#0F1419] to-[#1a1f2e] rounded-xl overflow-hidden">
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #CBA35D 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map(node => 
            node.connections.map(targetId => {
              const target = nodes.find(n => n.id === targetId);
              if (!target) return null;
              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke="rgba(203, 163, 93, 0.2)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = selectedNode === node.id;
          const color = getNodeColor(node.type);

          return (
            <motion.button
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
              onClick={() => setSelectedNode(node.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: isSelected ? 1.2 : 1,
              }}
            >
              <div className="relative">
                {/* Node circle */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
                  style={{
                    backgroundColor: color,
                    boxShadow: isSelected ? `0 0 30px ${color}` : `0 0 15px ${color}40`,
                  }}
                >
                  {getNodeIcon(node.type)}
                </div>

                {/* Label */}
                <div className="absolute top-full mt-2 whitespace-nowrap">
                  <div className="text-xs text-[#F3F4F6] bg-black/60 px-2 py-1 rounded">
                    {node.label}
                  </div>
                </div>

                {/* Selection ring */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 border-2 rounded-full"
                    style={{ borderColor: color }}
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="text-xs text-[#9CA3AF] mb-2">Node Types</div>
          {(['belief', 'goal', 'tension', 'pattern'] as const).map(type => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getNodeColor(type) }}
              />
              <span className="text-[#F3F4F6] capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Details Panel */}
      {selectedNodeData && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-[var(--color-surface-card)] border-l border-[var(--color-border-subtle)] p-6 space-y-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: getNodeColor(selectedNodeData.type) }}
              >
                {getNodeIcon(selectedNodeData.type)}
              </div>
              <div>
                <div className="text-sm text-[var(--color-text-muted)] capitalize">
                  {selectedNodeData.type}
                </div>
                <div className="text-lg font-medium text-[var(--color-text-primary)]">
                  {selectedNodeData.label}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Connections</div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {selectedNodeData.connections.length} related nodes
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Connected To</div>
              <div className="space-y-1">
                {selectedNodeData.connections.map(connId => {
                  const connNode = nodes.find(n => n.id === connId);
                  if (!connNode) return null;
                  return (
                    <button
                      key={connId}
                      onClick={() => setSelectedNode(connId)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-[var(--color-base-default)] hover:bg-[var(--color-surface-emphasis)] transition-all flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getNodeColor(connNode.type) }}
                      />
                      <span className="text-sm text-[var(--color-text-primary)]">
                        {connNode.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border-subtle)]">
            <button className="w-full px-4 py-2 bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] rounded-lg hover:bg-[var(--color-accent-gold)]/30 transition-all">
              Explore Reflections
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
