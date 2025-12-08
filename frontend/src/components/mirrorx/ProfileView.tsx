import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Brain, Sparkles } from 'lucide-react';
import { IdentityGraph } from './IdentityGraph';
import { EvolutionBadge } from './EvolutionBadge';
import { ReflectionCard } from './ReflectionCard';

interface ProfileViewProps {
  username?: string;
  className?: string;
}

export function ProfileView({ username = 'You', className = '' }: ProfileViewProps) {
  const stats = [
    { label: 'Reflections', value: '142', icon: Brain },
    { label: 'Evolution Score', value: '+28%', icon: TrendingUp },
    { label: 'Days Active', value: '47', icon: Calendar },
    { label: 'Breakthroughs', value: '12', icon: Sparkles },
  ];

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className}`}>
      {/* Header */}
      <motion.div
        className="p-6 border-b border-[#30303A]/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CBA35D] to-[#9C7C3C] flex items-center justify-center">
            <span className="text-3xl font-semibold text-black">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#E5E5E5]">{username}</h2>
            <p className="text-sm text-[#C4C4CF]/60">@{username.toLowerCase()}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="p-4 rounded-2xl border border-[#30303A]/30 backdrop-blur-xl"
              style={{
                background: 'rgba(11, 11, 13, 0.6)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className="text-[#CBA35D]" />
                <p className="text-xs text-[#C4C4CF]/60">{stat.label}</p>
              </div>
              <p className="text-2xl font-semibold text-[#E5E5E5]">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Recent evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-[#E5E5E5] mb-4">
            Recent Evolution
          </h3>
          <div className="flex flex-wrap gap-2">
            <EvolutionBadge type="breakthrough" label="Breakthrough • 2 days ago" />
            <EvolutionBadge type="growth" label="Growth • 5 days ago" />
            <EvolutionBadge type="stagnation" label="Stagnation • 1 week ago" />
          </div>
        </motion.div>

        {/* Identity graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <IdentityGraph />
        </motion.div>

        {/* Recent reflections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-[#E5E5E5] mb-4">
            Recent Reflections
          </h3>
          <div className="space-y-4">
            <ReflectionCard
              username={username}
              text="I realized today that I don't actually want to be understood. I want to be witnessed without explanation."
              timestamp="2 days ago"
              evolutionType="breakthrough"
              tone="direct"
              lens="Authenticity"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
