import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'gold' | 'ghost';
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'gold',
  disabled = false,
  className = '',
}: ActionButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all duration-300';

  const variantClasses = {
    gold: 'bg-[#CBA35D] text-black hover:bg-[#9C7C3C] disabled:bg-[#CBA35D]/30',
    ghost: 'bg-transparent border border-[#30303A]/40 text-[#E5E5E5] hover:border-[#CBA35D]/60 hover:bg-[#CBA35D]/10 disabled:opacity-30',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Icon size={18} />
      <span>{label}</span>
    </motion.button>
  );
}
