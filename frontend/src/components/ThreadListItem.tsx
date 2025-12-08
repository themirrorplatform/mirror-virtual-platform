import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface ThreadListItemProps {
  title: string;
  lastActive: string;
  reflectionCount: number;
  isActive: boolean;
  onClick: () => void;
  tone?: string;
}

export function ThreadListItem({
  title,
  lastActive,
  reflectionCount,
  isActive,
  onClick,
  tone = "soft",
}: ThreadListItemProps) {
  const toneColors = {
    soft: "#60A5FA",
    direct: "#F59E0B",
    playful: "#EC4899",
    austere: "#8B5CF6",
    silent: "#6B7280",
    provocative: "#EF4444",
  };

  const toneColor = toneColors[tone as keyof typeof toneColors] || toneColors.soft;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left relative p-4 rounded-lg transition-colors ${
        isActive
          ? "bg-[#1A1A1A] border border-[#CBA35D]/40"
          : "bg-[#0E0E0E]/50 border border-[#30303A]/40 hover:border-[#CBA35D]/30"
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeThread"
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#CBA35D] to-[#d4af37] rounded-l-lg"
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium truncate mb-1 ${
              isActive ? "text-[#FAFAFA]" : "text-[#BDBDBD]"
            }`}
          >
            {title}
          </h3>
          <p className="text-[#505050] text-xs">{lastActive}</p>
        </div>

        {/* Reflection count badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            isActive
              ? "bg-[#CBA35D]/20 text-[#CBA35D]"
              : "bg-[#30303A] text-[#BDBDBD]"
          }`}
        >
          <MessageCircle className="w-3 h-3" />
          <span>{reflectionCount}</span>
        </div>
      </div>

      {/* Tone indicator */}
      <div
        className="absolute bottom-2 right-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: toneColor, opacity: 0.6 }}
      />
    </motion.button>
  );
}
