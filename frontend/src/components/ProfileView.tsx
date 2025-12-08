import { motion } from "framer-motion";
import { TrendingUp, RotateCw, Zap } from "lucide-react";

interface Tension {
  id: string;
  label: string;
  strength: number;
}

interface Loop {
  id: string;
  pattern: string;
  occurrences: number;
}

interface GrowthMarker {
  id: string;
  type: "breakthrough" | "growth" | "regression";
  date: string;
  description: string;
}

interface ProfileViewProps {
  tensions: Tension[];
  emotionalSignature: number[];
  loops: Loop[];
  growthTimeline: GrowthMarker[];
  tone?: string;
}

export function ProfileView({
  tensions,
  emotionalSignature,
  loops,
  growthTimeline,
  tone = "soft",
}: ProfileViewProps) {
  // Generate SVG path for emotional signature
  const generateSignaturePath = () => {
    const width = 300;
    const height = 80;
    const points = emotionalSignature.map((val, idx) => {
      const x = (idx / (emotionalSignature.length - 1)) * width;
      const y = height - val * height;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  const markerIcons = {
    breakthrough: Zap,
    growth: TrendingUp,
    regression: TrendingUp,
  };

  const markerColors = {
    breakthrough: "text-purple-400 bg-purple-500/20 border-purple-500/40",
    growth: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
    regression: "text-red-400 bg-red-500/20 border-red-500/40",
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Tensions Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 backdrop-blur-sm border border-[#30303A] rounded-[1.5rem] p-6"
      >
        <h3 className="text-[#FAFAFA] font-semibold mb-4">Current Tensions</h3>
        <div className="space-y-4">
          {tensions.map((tension, idx) => (
            <div key={tension.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#BDBDBD] text-sm">{tension.label}</span>
                <span className="text-[#CBA35D] text-sm">
                  {Math.round(tension.strength * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#0E0E0E] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#CBA35D]"
                  initial={{ width: 0 }}
                  animate={{ width: `${tension.strength * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Emotional Signature */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 backdrop-blur-sm border border-[#30303A] rounded-[1.5rem] p-6"
      >
        <h3 className="text-[#FAFAFA] font-semibold mb-4">Emotional Signature</h3>
        <svg viewBox="0 0 300 80" className="w-full h-20">
          <motion.path
            d={generateSignaturePath()}
            fill="none"
            stroke="url(#signatureGradient)"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.3 }}
          />
          <defs>
            <linearGradient id="signatureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBA35D" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#CBA35D" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Loops Detection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 backdrop-blur-sm border border-[#30303A] rounded-[1.5rem] p-6"
      >
        <h3 className="text-[#FAFAFA] font-semibold mb-4">Detected Loops</h3>
        <div className="space-y-3">
          {loops.map((loop) => (
            <div
              key={loop.id}
              className="flex items-center justify-between p-3 bg-[#0E0E0E] border border-[#30303A] rounded-lg hover:border-[#CBA35D]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RotateCw className="w-5 h-5 text-[#CBA35D]" />
                <span className="text-[#FAFAFA] text-sm">{loop.pattern}</span>
              </div>
              <span className="text-[#BDBDBD] text-xs">
                {loop.occurrences} occurrences
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Growth Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 backdrop-blur-sm border border-[#30303A] rounded-[1.5rem] p-6"
      >
        <h3 className="text-[#FAFAFA] font-semibold mb-4">Growth Timeline</h3>
        <div className="space-y-4">
          {growthTimeline.map((marker, idx) => {
            const Icon = markerIcons[marker.type];
            return (
              <motion.div
                key={marker.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${markerColors[marker.type]}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-[#FAFAFA] font-medium mb-1">
                    {marker.description}
                  </div>
                  <div className="text-[#BDBDBD] text-xs">{marker.date}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
