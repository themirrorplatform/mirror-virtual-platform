/**
 * LayerIndicator - Shows current constitutional layer
 * Displays in top-right corner
 */

import { motion } from 'framer-motion';
import { Shield, Globe, Wrench } from 'lucide-react';
import { useMirrorStateContext } from '../contexts/MirrorStateContext';

export function LayerIndicator() {
  const { state, receipts } = useMirrorStateContext();

  const layerConfig = {
    sovereign: {
      icon: <Shield size={16} />,
      color: 'rgba(203, 163, 93, 1)',      // Gold
      bg: 'rgba(203, 163, 93, 0.1)',
      border: 'rgba(203, 163, 93, 0.3)',
      label: 'Sovereign',
      description: 'Private, local-only',
    },
    commons: {
      icon: <Globe size={16} />,
      color: 'rgba(147, 112, 219, 1)',     // Purple
      bg: 'rgba(147, 112, 219, 0.1)',
      border: 'rgba(147, 112, 219, 0.3)',
      label: 'Commons',
      description: 'Shared, collaborative',
    },
    builder: {
      icon: <Wrench size={16} />,
      color: 'rgba(64, 224, 208, 1)',      // Turquoise
      bg: 'rgba(64, 224, 208, 0.1)',
      border: 'rgba(64, 224, 208, 0.3)',
      label: 'Builder',
      description: 'Experimental',
    },
  };

  const config = layerConfig[state.layer];
  const recentReceipt = receipts[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="flex items-center gap-3">
        {/* Recent Receipt (if any) */}
        {recentReceipt && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] backdrop-blur-xl"
          >
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">
              {recentReceipt.title}
            </div>
          </motion.div>
        )}

        {/* Layer Indicator */}
        <motion.div
          layout
          className="px-3 py-2 rounded-lg backdrop-blur-xl flex items-center gap-2 cursor-pointer group"
          style={{
            background: config.bg,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: config.border,
            boxShadow: `0 0 20px ${config.bg}`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={`${config.label}: ${config.description}`}
        >
          <div style={{ color: config.color }}>
            {config.icon}
          </div>
          <span 
            className="text-sm font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>

          {/* Active Worldviews indicator */}
          {state.worldviews.length > 0 && (
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: config.color }}
            />
          )}

          {/* Crisis mode indicator */}
          {state.crisisMode && (
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}

          {/* Hover tooltip */}
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-black/90 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="font-medium">{config.label} Layer</div>
            <div className="text-white/70">{config.description}</div>
            {state.fork && <div className="text-white/50 mt-1">Fork: {state.fork}</div>}
            {state.worldviews.length > 0 && (
              <div className="text-white/50 mt-1">
                {state.worldviews.length} worldview{state.worldviews.length > 1 ? 's' : ''}
              </div>
            )}
            <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black/90" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
