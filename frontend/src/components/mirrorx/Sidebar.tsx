import React from 'react';
import { motion } from 'framer-motion';
import { Home, Network, MessageSquare, User, Settings, LogOut } from 'lucide-react';
import { GhostButton } from './GhostButton';

interface SidebarProps {
  activeView: 'reflect' | 'graph' | 'thread' | 'profile';
  onViewChange: (view: 'reflect' | 'graph' | 'thread' | 'profile') => void;
  username?: string;
  className?: string;
}

export function Sidebar({
  activeView,
  onViewChange,
  username = 'You',
  className = '',
}: SidebarProps) {
  const navItems = [
    { id: 'reflect' as const, icon: Home, label: 'Reflect' },
    { id: 'graph' as const, icon: Network, label: 'Graph' },
    { id: 'thread' as const, icon: MessageSquare, label: 'Threads' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <motion.aside
      className={`w-64 h-screen border-r border-[#30303A]/30 backdrop-blur-xl flex flex-col ${className}`}
      style={{
        background: 'rgba(11, 11, 13, 0.8)',
      }}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Logo/Brand */}
      <div className="p-6 border-b border-[#30303A]/30">
        <h1 className="text-xl font-bold text-[#E5E5E5] mb-1">
          The Mirror
        </h1>
        <p className="text-xs text-[#C4C4CF]/60">Virtual Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
              activeView === item.id
                ? 'bg-[#CBA35D]/10 text-[#CBA35D] border border-[#CBA35D]/30'
                : 'text-[#C4C4CF]/60 hover:text-[#E5E5E5] hover:bg-[#30303A]/20'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[#30303A]/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CBA35D] to-[#9C7C3C] flex items-center justify-center">
            <span className="text-sm font-semibold text-black">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#E5E5E5]">{username}</p>
            <p className="text-xs text-[#C4C4CF]/60">@{username.toLowerCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton icon={Settings} size={18} className="flex-1" />
          <GhostButton icon={LogOut} size={18} className="flex-1" />
        </div>
      </div>
    </motion.aside>
  );
}
