import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  strength: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

interface IdentityGraphProps {
  nodes?: Node[];
  edges?: Edge[];
  className?: string;
}

export function IdentityGraph({ nodes = [], edges = [], className = '' }: IdentityGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = 'rgba(11, 11, 13, 0.9)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = `rgba(203, 163, 93, ${edge.weight * 0.5})`;
      ctx.lineWidth = edge.weight * 2;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node) => {
      // Glow effect
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 30);
      gradient.addColorStop(0, `rgba(203, 163, 93, ${node.strength * 0.3})`);
      gradient.addColorStop(1, 'rgba(203, 163, 93, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(node.x - 30, node.y - 30, 60, 60);

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8 + node.strength * 4, 0, Math.PI * 2);
      ctx.fillStyle = '#CBA35D';
      ctx.fill();
      ctx.strokeStyle = '#0B0B0D';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#E5E5E5';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 25);
    });
  }, [nodes, edges]);

  // Generate sample data if none provided
  const sampleNodes: Node[] = nodes.length
    ? nodes
    : [
        { id: '1', label: 'Creativity', x: 150, y: 100, strength: 0.8 },
        { id: '2', label: 'Logic', x: 300, y: 120, strength: 0.6 },
        { id: '3', label: 'Empathy', x: 225, y: 220, strength: 0.9 },
        { id: '4', label: 'Ambition', x: 100, y: 200, strength: 0.5 },
        { id: '5', label: 'Patience', x: 350, y: 200, strength: 0.7 },
      ];

  const sampleEdges: Edge[] = edges.length
    ? edges
    : [
        { from: '1', to: '3', weight: 0.7 },
        { from: '2', to: '3', weight: 0.5 },
        { from: '3', to: '4', weight: 0.6 },
        { from: '3', to: '5', weight: 0.8 },
        { from: '1', to: '2', weight: 0.4 },
      ];

  return (
    <motion.div
      className={`mirror-glass rounded-3xl overflow-hidden border border-[#30303A]/30 backdrop-blur-xl ${className}`}
      style={{
        background: 'rgba(11, 11, 13, 0.6)',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 border-b border-[#30303A]/30">
        <h3 className="text-[#E5E5E5] font-medium">Identity Graph</h3>
        <p className="text-xs text-[#C4C4CF]/60 mt-1">
          Your evolving network of self
        </p>
      </div>
      <div className="relative w-full h-80">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
    </motion.div>
  );
}
