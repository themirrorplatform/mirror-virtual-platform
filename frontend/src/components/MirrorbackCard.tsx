import { motion } from "framer-motion";

export type EvolutionSignal = "growth" | "loop" | "regression" | "breakthrough" | "stagnation";

interface MirrorbackCardProps {
  content: string;
  timestamp?: string;
  evolutionSignals?: EvolutionSignal[];
  evolutionSignal?: EvolutionSignal;
  signal?: EvolutionSignal;
  emotionalIntensity: number;
  tone?: string;
}

const signalColors: Record<EvolutionSignal, string> = {
  growth: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  loop: "bg-[#CBA35D]/20 text-[#CBA35D] border-[#CBA35D]/40",
  regression: "bg-red-500/20 text-red-400 border-red-500/40",
  breakthrough: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  stagnation: "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

const signalLabels: Record<EvolutionSignal, string> = {
  growth: "Growth",
  loop: "Pattern Loop",
  regression: "Regression",
  breakthrough: "Breakthrough",
  stagnation: "Stagnation",
};

export function MirrorbackCard({
  content,
  timestamp,
  evolutionSignals,
  evolutionSignal,
  signal,
  emotionalIntensity,
  tone = "soft",
}: MirrorbackCardProps) {
  // Normalize evolution signals from different prop variations
  const signals = evolutionSignals 
    || (evolutionSignal ? [evolutionSignal] : [])
    || (signal ? [signal] : []);
    
  // Split content into paragraphs
  const paragraphs = content.split("\n\n").filter((p) => p.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 backdrop-blur-sm border border-[#30303A] rounded-[1.5rem] p-6 overflow-hidden"
    >
      {/* Gold accent line at top */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CBA35D] to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Header with evolution badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {signals.map((sig, idx) => (
            <motion.span
              key={sig}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`px-3 py-1 text-xs rounded-full border ${signalColors[sig]}`}
            >
              {signalLabels[sig]}
            </motion.span>
          ))}
        </div>

        {timestamp && (
          <span className="text-xs text-[#BDBDBD] whitespace-nowrap ml-4">
            {timestamp}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {paragraphs.map((para, idx) => (
          <div key={idx}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="text-[#FAFAFA] leading-relaxed"
            >
              {para}
            </motion.p>

            {/* Gradient divider between paragraphs */}
            {idx < paragraphs.length - 1 && (
              <div className="my-4 h-px bg-gradient-to-r from-transparent via-[#30303A] to-transparent" />
            )}
          </div>
        ))}
      </div>

      {/* Emotional intensity bar */}
      {emotionalIntensity > 0 && (
        <div className="mt-6 pt-4 border-t border-[#30303A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#BDBDBD]">Emotional Intensity</span>
            <span className="text-xs text-[#CBA35D]">
              {Math.round(emotionalIntensity * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#0E0E0E] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#CBA35D] via-[#d4af37] to-[#CBA35D]"
              initial={{ width: 0 }}
              animate={{ width: `${emotionalIntensity * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#CBA35D]/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[1.5rem]" />
    </motion.div>
  );
}
