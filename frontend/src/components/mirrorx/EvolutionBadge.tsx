import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Sparkles } from 'lucide-react';

interface EvolutionBadgeProps {
  type: 'growth' | 'stagnation' | 'breakthrough' | 'regression';
  label?: string;
  className?: string;
}

export function EvolutionBadge({ type, label, className = '' }: EvolutionBadgeProps) {
  const config = {
    growth: {
      icon: TrendingUp,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      defaultLabel: 'Growth',
    },
    stagnation: {
      icon: Target,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      defaultLabel: 'Stagnation',
    },
    breakthrough: {
      icon: Sparkles,
      color: '#CBA35D',
      bgColor: 'rgba(203, 163, 93, 0.1)',
      defaultLabel: 'Breakthrough',
    },
    regression: {
      icon: TrendingDown,
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      defaultLabel: 'Regression',
    },
  };

  const { icon: Icon, color, bgColor, defaultLabel } = config[type];

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: bgColor,
        color: color,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Icon size={14} />
      <span>{label || defaultLabel}</span>
    </motion.div>
  );
}
