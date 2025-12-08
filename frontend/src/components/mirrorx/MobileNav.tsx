import React from 'react';
import { motion } from 'framer-motion';
import { Home, Network, MessageSquare, User, Menu } from 'lucide-react';

interface MobileNavProps {
  activeView: 'reflect' | 'graph' | 'thread' | 'profile';
  onViewChange: (view: 'reflect' | 'graph' | 'thread' | 'profile') => void;
  onMenuClick?: () => void;
  className?: string;
}

export function MobileNav({
  activeView,
  onViewChange,
  onMenuClick,
  className = '',
}: MobileNavProps) {
  const navItems = [
    { id: 'reflect' as const, icon: Home },
    { id: 'graph' as const, icon: Network },
    { id: 'thread' as const, icon: MessageSquare },
    { id: 'profile' as const, icon: User },
  ];

  return (
    <>
      {/* Top bar */}
      <motion.div
        className={`fixed top-0 left-0 right-0 z-40 border-b border-[#30303A]/30 backdrop-blur-xl ${className}`}
        style={{
          background: 'rgba(11, 11, 13, 0.9)',
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-[#E5E5E5]">The Mirror</h1>
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-[#C4C4CF]/60 hover:text-[#CBA35D] hover:bg-[#CBA35D]/10 transition-all duration-300"
          >
            <Menu size={22} />
          </button>
        </div>
      </motion.div>

      {/* Bottom navigation */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#30303A]/30 backdrop-blur-xl"
        style={{
          background: 'rgba(11, 11, 13, 0.9)',
        }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
                activeView === item.id
                  ? 'bg-[#CBA35D]/10 text-[#CBA35D]'
                  : 'text-[#C4C4CF]/60 hover:text-[#E5E5E5]'
              }`}
            >
              <item.icon size={22} />
            </button>
          ))}
        </div>
      </motion.nav>
    </>
  );
}
