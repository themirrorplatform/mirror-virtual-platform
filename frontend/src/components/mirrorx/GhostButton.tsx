import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface GhostButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  size?: number;
}

export function GhostButton({
  icon: Icon,
  onClick,
  active = false,
  className = '',
  size = 20,
}: GhostButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all duration-300 ${
        active
          ? 'bg-[#CBA35D]/20 text-[#CBA35D]'
          : 'bg-transparent text-[#C4C4CF]/60 hover:text-[#CBA35D] hover:bg-[#CBA35D]/10'
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Icon size={size} />
    </motion.button>
  );
}
