import { useRef, useEffect, useState } from "react";
import { GhostButton } from "./GhostButton";

type NodeType = "core" | "belief" | "tension" | "paradox";
type EdgeType = "normal" | "loop" | "contradiction" | "paradox";

interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  strength: number;
}

interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  strength: number;
}

interface IdentityGraphProps {
  nodes: Node[];
  edges: Edge[];
  tone?: string;
}

export function IdentityGraph({ nodes, edges, tone = "soft" }: IdentityGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [view, setView] = useState<"graph" | "tensions" | "loops">("graph");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with DPR scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw edges first
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);

      // Edge styling based on type
      switch (edge.type) {
        case "loop":
          ctx.strokeStyle = `rgba(203, 163, 93, ${edge.strength})`;
          ctx.setLineDash([5, 5]);
          break;
        case "contradiction":
          ctx.strokeStyle = `rgba(239, 68, 68, ${edge.strength})`;
          ctx.setLineDash([]);
          break;
        case "paradox":
          ctx.strokeStyle = `rgba(168, 85, 247, ${edge.strength})`;
          ctx.setLineDash([10, 5]);
          break;
        default:
          ctx.strokeStyle = `rgba(189, 189, 189, ${edge.strength})`;
          ctx.setLineDash([]);
      }

      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredNode?.id === node.id;
      const radius = isHovered ? 12 : 10;

      // Node glow
      if (isHovered || node.type === "core") {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(203, 163, 93, 0.6)";
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      // Node color based on type
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
      switch (node.type) {
        case "core":
          gradient.addColorStop(0, "rgba(203, 163, 93, 1)");
          gradient.addColorStop(1, "rgba(203, 163, 93, 0.6)");
          break;
        case "belief":
          gradient.addColorStop(0, "rgba(96, 165, 250, 1)");
          gradient.addColorStop(1, "rgba(96, 165, 250, 0.6)");
          break;
        case "tension":
          gradient.addColorStop(0, "rgba(239, 68, 68, 1)");
          gradient.addColorStop(1, "rgba(239, 68, 68, 0.6)");
          break;
        case "paradox":
          gradient.addColorStop(0, "rgba(168, 85, 247, 1)");
          gradient.addColorStop(1, "rgba(168, 85, 247, 0.6)");
          break;
      }

      ctx.fillStyle = gradient;
      ctx.fill();

      // Node border
      ctx.strokeStyle = "#0E0E0E";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw label if hovered
      if (isHovered) {
        ctx.font = "12px Inter";
        ctx.fillStyle = "#FAFAFA";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y - 20);
      }
    });
  }, [nodes, edges, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if mouse is over any node
    const hovered = nodes.find((node) => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance < 12;
    });

    setHoveredNode(hovered || null);
  };

  const tensions = nodes.filter((n) => n.type === "tension");
  const loops = edges.filter((e) => e.type === "loop");

  return (
    <div className="w-full h-full bg-[#0E0E0E] rounded-[2rem] border-2 border-[#30303A] overflow-hidden">
      {/* View toggle */}
      <div className="flex items-center gap-2 p-4 border-b border-[#30303A]">
        <GhostButton
          active={view === "graph"}
          onClick={() => setView("graph")}
          size="sm"
        >
          Graph
        </GhostButton>
        <GhostButton
          active={view === "tensions"}
          onClick={() => setView("tensions")}
          size="sm"
        >
          Tensions ({tensions.length})
        </GhostButton>
        <GhostButton
          active={view === "loops"}
          onClick={() => setView("loops")}
          size="sm"
        >
          Loops ({loops.length})
        </GhostButton>
      </div>

      {/* Content */}
      {view === "graph" && (
        <div className="relative w-full h-[600px] md:h-[800px]">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
            className="w-full h-full cursor-crosshair"
            style={{ width: "100%", height: "100%" }}
          />

          {/* Hover tooltip */}
          {hoveredNode && (
            <div className="absolute top-4 left-4 bg-[#1A1A1A] border border-[#CBA35D] rounded-lg p-3 max-w-xs">
              <div className="text-[#CBA35D] text-xs uppercase tracking-wider mb-1">
                {hoveredNode.type}
              </div>
              <div className="text-[#FAFAFA] font-medium mb-1">
                {hoveredNode.label}
              </div>
              <div className="text-[#BDBDBD] text-sm">
                Strength: {Math.round(hoveredNode.strength * 100)}%
              </div>
            </div>
          )}
        </div>
      )}

      {view === "tensions" && (
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {tensions.map((tension) => (
            <div
              key={tension.id}
              className="bg-[#1A1A1A] border border-[#30303A] rounded-lg p-4 hover:border-[#CBA35D]/40 transition-colors"
            >
              <div className="text-[#FAFAFA] font-medium mb-2">{tension.label}</div>
              <div className="w-full bg-[#0E0E0E] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#EF4444] to-[#F59E0B] h-full rounded-full"
                  style={{ width: `${tension.strength * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "loops" && (
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {loops.map((loop, idx) => {
            const fromNode = nodes.find((n) => n.id === loop.from);
            const toNode = nodes.find((n) => n.id === loop.to);
            return (
              <div
                key={idx}
                className="bg-[#1A1A1A] border border-[#30303A] rounded-lg p-4 hover:border-[#CBA35D]/40 transition-colors"
              >
                <div className="text-[#CBA35D] text-sm mb-2">
                  {fromNode?.label} ↔ {toNode?.label}
                </div>
                <div className="text-[#BDBDBD] text-sm">
                  Strength: {Math.round(loop.strength * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
