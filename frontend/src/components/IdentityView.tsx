import { Network, Zap, Users, BookOpen, TrendingUp } from 'lucide-react';

export function IdentityView() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#14141a] to-[#0b0b0d]">
      <div className="max-w-[1534px] mx-auto px-[24px] py-[40px]">
        {/* Header */}
        <div className="mb-[40px]">
          <h1 className="font-['EB_Garamond:Regular',sans-serif] text-[60px] leading-[72px] text-neutral-200 mb-[8px]">
            Identity Graph
          </h1>
          <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(196,196,207,0.6)]">
            Your evolving network of ideas, connections, and reflections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[48px]">
          {/* Main Graph View */}
          <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[24px] p-[40px] min-h-[600px]">
            {/* IdentityGraph component imported from IdentityGraph.tsx */}
            <IdentityGraphPlaceholder />
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-[24px]">
            <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[24px]">
              <h3 className="font-['EB_Garamond:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(203,163,93,0.7)] tracking-[0.7px] uppercase mb-[20px]">
                Identity Metrics
              </h3>
              <div className="space-y-[16px]">
                <StatItem label="Core Themes" value="12" icon={<BookOpen size={16} />} />
                <StatItem label="Connections" value="48" icon={<Network size={16} />} />
                <StatItem label="Active Threads" value="5" icon={<TrendingUp size={16} />} />
                <StatItem label="Collaborators" value="23" icon={<Users size={16} />} />
              </div>
            </div>

            <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[24px]">
              <h3 className="font-['EB_Garamond:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(203,163,93,0.7)] tracking-[0.7px] uppercase mb-[16px]">
                Strongest Nodes
              </h3>
              <div className="space-y-[12px]">
                <NodeTag label="Consciousness" strength={95} />
                <NodeTag label="Self-observation" strength={87} />
                <NodeTag label="Paradox" strength={82} />
                <NodeTag label="Change" strength={76} />
              </div>
            </div>

            <div className="bg-gradient-to-b from-[rgba(203,163,93,0.1)] to-transparent border border-[rgba(203,163,93,0.2)] rounded-[16px] p-[24px]">
              <div className="flex items-center gap-[8px] mb-[12px]">
                <Zap size={16} className="text-[#cba35d]" />
                <h3 className="font-['EB_Garamond:Regular',sans-serif] text-[14px] leading-[20px] text-[#cba35d] tracking-[0.7px] uppercase">
                  Emerging Pattern
                </h3>
              </div>
              <p className="font-['Inter:Regular',sans-serif] text-[14px] leading-[22.75px] text-[rgba(196,196,207,0.8)]">
                Your reflections increasingly bridge the gap between awareness and embodied action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IdentityGraph() {
  const nodes = [
    { id: 1, label: 'Consciousness', x: 50, y: 30, size: 95, color: '#cba35d' },
    { id: 2, label: 'Self-observation', x: 30, y: 50, size: 87, color: '#4ed4a7' },
    { id: 3, label: 'Paradox', x: 70, y: 50, size: 82, color: '#3a8bff' },
    { id: 4, label: 'Change', x: 50, y: 70, size: 76, color: '#f5a623' },
    { id: 5, label: 'Awareness', x: 20, y: 30, size: 68, color: '#c4c4cf' },
    { id: 6, label: 'Patterns', x: 80, y: 30, size: 64, color: '#c4c4cf' },
    { id: 7, label: 'Embodiment', x: 35, y: 75, size: 58, color: '#c4c4cf' },
    { id: 8, label: 'Time', x: 65, y: 75, size: 52, color: '#c4c4cf' },
  ];

  const connections = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 3, to: 4 },
    { from: 1, to: 5 },
    { from: 1, to: 6 },
    { from: 2, to: 7 },
    { from: 4, to: 7 },
    { from: 3, to: 8 },
    { from: 4, to: 8 },
  ];

  return (
    <div className="relative w-full h-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Connections */}
        <g opacity="0.3">
          {connections.map((conn, i) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            return (
              <line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#cba35d"
                strokeWidth="0.2"
              />
            );
          })}
        </g>

        {/* Nodes */}
        {nodes.map((node) => {
          const radius = (node.size / 100) * 3 + 1;
          return (
            <g key={node.id}>
              {/* Glow effect */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius + 0.8}
                fill={node.color}
                opacity="0.15"
              />
              {/* Node */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={node.color}
                opacity="0.8"
                className="cursor-pointer hover:opacity-100 transition-opacity"
              />
              {/* Label */}
              <text
                x={node.x}
                y={node.y + radius + 2}
                textAnchor="middle"
                fill="#c4c4cf"
                fontSize="2.5"
                className="font-['Inter:Regular',sans-serif]"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-[20px] left-[20px] bg-[rgba(11,11,13,0.8)] border border-[rgba(48,48,58,0.5)] rounded-[12px] px-[16px] py-[12px]">
        <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[rgba(196,196,207,0.6)] mb-[8px]">
          Node size = reflection frequency
        </p>
        <div className="flex items-center gap-[12px]">
          <div className="flex items-center gap-[6px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#cba35d]" />
            <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[rgba(196,196,207,0.6)]">
              Primary
            </span>
          </div>
          <div className="flex items-center gap-[6px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#4ed4a7]" />
            <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[rgba(196,196,207,0.6)]">
              Growing
            </span>
          </div>
          <div className="flex items-center gap-[6px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#3a8bff]" />
            <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[rgba(196,196,207,0.6)]">
              Emerging
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[8px]">
        <div className="text-[rgba(203,163,93,0.6)]">{icon}</div>
        <span className="font-['Inter:Regular',sans-serif] text-[14px] text-[rgba(196,196,207,0.7)]">
          {label}
        </span>
      </div>
      <span className="font-['Inter:Medium',sans-serif] text-[16px] text-neutral-200">
        {value}
      </span>
    </div>
  );
}

interface NodeTagProps {
  label: string;
  strength: number;
}

function NodeTag({ label, strength }: NodeTagProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[4px]">
        <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.8)]">
          {label}
        </span>
        <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[rgba(196,196,207,0.6)]">
          {strength}%
        </span>
      </div>
      <div className="bg-[#0b0b0d] h-[3px] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#cba35d] to-[#d6af36] rounded-full"
          style={{ width: `${strength}%` }}
        />
      </div>
    </div>
  );
}
