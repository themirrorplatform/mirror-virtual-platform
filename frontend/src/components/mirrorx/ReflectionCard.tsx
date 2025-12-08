import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { GhostButton } from './GhostButton';
import { EvolutionBadge } from './EvolutionBadge';

interface ReflectionCardProps {
  username: string;
  text: string;
  timestamp: string;
  evolutionType?: 'growth' | 'stagnation' | 'breakthrough' | 'regression';
  tone?: 'soft' | 'direct' | 'playful' | 'austere' | 'silent' | 'provocative';
  lens?: string;
  onReply?: () => void;
  className?: string;
}

export function ReflectionCard({
  username,
  text,
  timestamp,
  evolutionType,
  tone = 'soft',
  lens,
  onReply,
  className = '',
}: ReflectionCardProps) {
  return (
    <motion.div
      className={`mirror-glass rounded-3xl p-6 border border-[#30303A]/30 backdrop-blur-xl ${className}`}
      style={{
        background: 'rgba(11, 11, 13, 0.6)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ borderColor: 'rgba(203, 163, 93, 0.3)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CBA35D] to-[#9C7C3C] flex items-center justify-center">
            <span className="text-sm font-semibold text-black">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[#E5E5E5] font-medium">{username}</p>
            <p className="text-xs text-[#C4C4CF]/60">{timestamp}</p>
          </div>
        </div>
        <GhostButton icon={MoreHorizontal} size={18} />
      </div>

      {/* Badges */}
      {(evolutionType || lens) && (
        <div className="flex items-center gap-2 mb-4">
          {evolutionType && <EvolutionBadge type={evolutionType} />}
          {lens && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#30303A]/30 text-[#C4C4CF]/80">
              {lens}
            </span>
          )}
        </div>
      )}

      {/* Reflection text */}
      <p className="text-[#E5E5E5] leading-relaxed mb-5">{text}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#30303A]/30">
        <GhostButton icon={Heart} size={18} />
        <GhostButton icon={MessageCircle} size={18} onClick={onReply} />
        <GhostButton icon={Share2} size={18} />
      </div>
    </motion.div>
  );
}
