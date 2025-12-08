import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, LogOut } from 'lucide-react';
import { GhostButton } from './GhostButton';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  className?: string;
}

export function MobileSidebar({
  isOpen,
  onClose,
  username = 'You',
  className = '',
}: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] border-l border-[#30303A]/30 backdrop-blur-xl z-50 flex flex-col ${className}`}
            style={{
              background: 'rgba(11, 11, 13, 0.95)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#30303A]/30">
              <div>
                <h2 className="text-xl font-bold text-[#E5E5E5]">Menu</h2>
                <p className="text-xs text-[#C4C4CF]/60 mt-1">The Mirror Virtual Platform</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#C4C4CF]/60 hover:text-[#CBA35D] hover:bg-[#CBA35D]/10 transition-all duration-300"
              >
                <X size={22} />
              </button>
            </div>

            {/* User profile */}
            <div className="p-6 border-b border-[#30303A]/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CBA35D] to-[#9C7C3C] flex items-center justify-center">
                  <span className="text-2xl font-semibold text-black">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium text-[#E5E5E5]">{username}</p>
                  <p className="text-sm text-[#C4C4CF]/60">@{username.toLowerCase()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#30303A]/20">
                  <p className="text-xs text-[#C4C4CF]/60">Reflections</p>
                  <p className="text-xl font-semibold text-[#E5E5E5] mt-1">42</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#30303A]/20">
                  <p className="text-xs text-[#C4C4CF]/60">Evolution</p>
                  <p className="text-xl font-semibold text-[#CBA35D] mt-1">+12%</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 p-6 space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#C4C4CF]/60 hover:text-[#E5E5E5] hover:bg-[#30303A]/20 transition-all duration-300">
                <Settings size={20} />
                <span className="font-medium">Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#C4C4CF]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all duration-300">
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#30303A]/30">
              <p className="text-xs text-[#C4C4CF]/40 italic text-center">
                Reflection over instruction
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
