import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface MirrorbackCardProps {
  text: string;
  tone?: 'soft' | 'direct' | 'playful' | 'austere' | 'silent' | 'provocative';
  timestamp?: string;
  className?: string;
}

export function MirrorbackCard({
  text,
  tone = 'soft',
  timestamp,
  className = '',
}: MirrorbackCardProps) {
  const toneColors = {
    soft: 'rgba(203, 163, 93, 0.15)',
    direct: 'rgba(239, 68, 68, 0.15)',
    playful: 'rgba(168, 85, 247, 0.15)',
    austere: 'rgba(100, 116, 139, 0.15)',
    silent: 'rgba(75, 85, 99, 0.15)',
    provocative: 'rgba(234, 179, 8, 0.15)',
  };

  const toneTextColors = {
    soft: '#CBA35D',
    direct: '#EF4444',
    playful: '#A855F7',
    austere: '#64748B',
    silent: '#4B5563',
    provocative: '#EAB308',
  };

  return (
    <motion.div
      className={`rounded-3xl p-6 border backdrop-blur-xl ${className}`}
      style={{
        background: toneColors[tone],
        borderColor: `${toneTextColors[tone]}40`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* MirrorX indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${toneTextColors[tone]}20` }}
        >
          <Sparkles size={16} style={{ color: toneTextColors[tone] }} />
        </div>
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: toneTextColors[tone] }}
          >
            MirrorX • {tone}
          </p>
          {timestamp && (
            <p className="text-xs text-[#C4C4CF]/60 mt-0.5">{timestamp}</p>
          )}
        </div>
      </div>

      {/* Mirrorback text */}
      <p className="text-[#E5E5E5] leading-relaxed italic">{text}</p>
    </motion.div>
  );
}
