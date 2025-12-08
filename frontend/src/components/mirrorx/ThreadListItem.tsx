import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, TrendingUp } from 'lucide-react';

interface ThreadListItemProps {
  username: string;
  preview: string;
  timestamp: string;
  replyCount: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ThreadListItem({
  username,
  preview,
  timestamp,
  replyCount,
  isActive = false,
  onClick,
  className = '',
}: ThreadListItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
        isActive
          ? 'bg-[#CBA35D]/10 border border-[#CBA35D]/30'
          : 'bg-[#0B0B0D]/50 border border-[#30303A]/30 hover:border-[#CBA35D]/20 hover:bg-[#CBA35D]/5'
      } ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CBA35D] to-[#9C7C3C] flex items-center justify-center">
            <span className="text-xs font-semibold text-black">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-[#E5E5E5]">{username}</span>
        </div>
        <span className="text-xs text-[#C4C4CF]/60">{timestamp}</span>
      </div>

      {/* Preview */}
      <p className="text-sm text-[#C4C4CF]/80 line-clamp-2 mb-3">{preview}</p>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-[#C4C4CF]/60">
        <div className="flex items-center gap-1">
          <MessageCircle size={14} />
          <span>{replyCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={14} />
          <span>Active</span>
        </div>
      </div>
    </motion.button>
  );
}
