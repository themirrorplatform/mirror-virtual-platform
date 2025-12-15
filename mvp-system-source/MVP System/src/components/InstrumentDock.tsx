/**
 * Instrument Dock - Minimized instruments bar
 * Shows minimized instruments at the bottom of the screen
 */

import { motion, AnimatePresence } from 'motion/react';

interface DockItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: 'input' | 'reflection' | 'time' | 'identity' | 'commons' | 'sovereignty' | 'builder';
}

interface InstrumentDockProps {
  items: DockItem[];
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
}

export function InstrumentDock({ items, onRestore, onClose }: InstrumentDockProps) {
  if (items.length === 0) return null;

  const categoryGlow = {
    input: 'rgba(203, 163, 93, 0.6)',
    reflection: 'rgba(147, 112, 219, 0.6)',
    time: 'rgba(100, 181, 246, 0.6)',
    identity: 'rgba(129, 212, 250, 0.6)',
    commons: 'rgba(147, 112, 219, 0.6)',
    sovereignty: 'rgba(239, 68, 68, 0.6)',
    builder: 'rgba(64, 224, 208, 0.6)',
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-surface-card)] backdrop-blur-2xl rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.button
              key={item.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ 
                scale: 1.1,
                y: -8,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRestore(item.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                onClose(item.id);
              }}
              className="relative group"
              title={item.title}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: `${categoryGlow[item.category]}20`,
                  border: `2px solid ${categoryGlow[item.category]}`,
                  boxShadow: `0 0 20px ${categoryGlow[item.category]}40`,
                }}
              >
                <div style={{ color: categoryGlow[item.category] }}>
                  {item.icon}
                </div>
              </div>

              {/* Hover tooltip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap pointer-events-none"
              >
                {item.title}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
              </motion.div>

              {/* Pulse indicator */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{
                  background: categoryGlow[item.category],
                  boxShadow: `0 0 10px ${categoryGlow[item.category]}`,
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Divider */}
        {items.length > 0 && (
          <div className="w-px h-8 bg-white/10" />
        )}

        {/* Dock hint */}
        <div className="text-xs text-[var(--color-text-muted)] px-2">
          Click to restore • Right-click to close
        </div>
      </div>
    </motion.div>
  );
}