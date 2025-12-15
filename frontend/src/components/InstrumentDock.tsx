/**
 * InstrumentDock - Minimized Instruments Bar
 * Shows minimized instruments at bottom of screen
 * Enhanced with improved animations and global instrument access
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { GitBranch, AlertTriangle, Heart, GitMerge, Eye, Sparkles } from 'lucide-react';
import { ForkEntryInstrument } from './instruments/ForkEntryInstrument';
import { SafetyPlanInstrument } from './instruments/SafetyPlanInstrument';
import { PauseAndGroundInstrument } from './instruments/PauseAndGroundInstrument';
import { ConflictResolutionInstrument } from './instruments/ConflictResolutionInstrument';
import { WorldviewLensInstrument } from './instruments/WorldviewLensInstrument';
import { useMirrorStateContext } from '@/contexts/MirrorStateContext';

export type InstrumentCategory = 'input' | 'reflection' | 'time' | 'identity' | 'commons' | 'sovereignty' | 'builder';

export interface DockItem {
  id: string;
  title: string;
  icon: ReactNode;
  category: InstrumentCategory;
}

interface InstrumentDockProps {
  items: DockItem[];
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
}

const categoryColors: Record<InstrumentCategory, string> = {
  input: 'rgba(203, 163, 93, 0.6)',           // Gold
  reflection: 'rgba(147, 112, 219, 0.6)',     // Purple
  time: 'rgba(100, 181, 246, 0.6)',           // Blue
  identity: 'rgba(129, 212, 250, 0.6)',       // Light Blue
  commons: 'rgba(147, 112, 219, 0.6)',        // Purple
  sovereignty: 'rgba(239, 68, 68, 0.6)',      // Red
  builder: 'rgba(64, 224, 208, 0.6)',         // Turquoise
};

type GlobalInstrument = 
  | 'fork'
  | 'safety'
  | 'pause'
  | 'conflict'
  | 'worldview'
  | null;

export function InstrumentDock({ items, onRestore, onClose }: InstrumentDockProps) {
  const { state, actions } = useMirrorStateContext();
  const [activeInstrument, setActiveInstrument] = useState<GlobalInstrument>(null);

  const handleInstrumentComplete = (instrumentType: string, data?: any) => {
    setActiveInstrument(null);
    actions.addReceipt({
      id: `${instrumentType}-${Date.now()}`,
      type: instrumentType === 'fork' ? 'fork_entry' : 
            instrumentType === 'worldview' ? 'worldview' : 
            instrumentType === 'conflict' ? 'conflict_resolution' : 
            'layer_switch',
      timestamp: new Date().toISOString(),
      title: `${instrumentType} Used`,
      description: 'Global instrument accessed',
      layer: state.layer,
      data: data || {}
    });
  };

  // Global instruments always available
  const globalInstruments = [
    {
      id: 'fork',
      icon: <GitBranch className="w-5 h-5" />,
      label: 'Fork Entry',
      color: categoryColors.builder,
      description: 'Create layer split'
    },
    {
      id: 'safety',
      icon: <Heart className="w-5 h-5" />,
      label: 'Safety Plan',
      color: categoryColors.sovereignty,
      description: 'Crisis planning'
    },
    {
      id: 'pause',
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'Pause & Ground',
      color: categoryColors.sovereignty,
      description: 'Crisis intervention'
    },
    {
      id: 'conflict',
      icon: <GitMerge className="w-5 h-5" />,
      label: 'Conflict Resolution',
      color: categoryColors.commons,
      description: 'Handle conflicts'
    },
    {
      id: 'worldview',
      icon: <Eye className="w-5 h-5" />,
      label: 'Worldview Lens',
      color: categoryColors.identity,
      description: 'Apply perspective'
    }
  ];

  return (
    <>
      {/* Global Instrument Modals */}
      <AnimatePresence>
        {activeInstrument === 'fork' && (
          <ForkEntryInstrument
            onComplete={(fork) => handleInstrumentComplete('Fork Entry', fork)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'safety' && (
          <SafetyPlanInstrument
            onComplete={(plan) => handleInstrumentComplete('Safety Plan', plan)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'pause' && (
          <PauseAndGroundInstrument
            onComplete={() => handleInstrumentComplete('Pause & Ground')}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'conflict' && (
          <ConflictResolutionInstrument
            onComplete={(resolution) => handleInstrumentComplete('Conflict Resolution', resolution)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'worldview' && (
          <WorldviewLensInstrument
            onComplete={(lens) => handleInstrumentComplete('Worldview Lens', lens)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-surface-card)] backdrop-blur-2xl rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl">
          {/* Global Instruments */}
          <div className="flex items-center gap-2">
            {globalInstruments.map((instrument) => (
              <button
                key={instrument.id}
                onClick={() => setActiveInstrument(instrument.id as GlobalInstrument)}
                className="relative group"
                title={instrument.description}
              >
                <motion.div
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: `${instrument.color}20`,
                    border: `1.5px solid ${instrument.color}`,
                  }}
                >
                  <div style={{ color: instrument.color }}>
                    {instrument.icon}
                  </div>
                </motion.div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 backdrop-blur-sm rounded text-xs text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {instrument.label}
                </div>
              </button>
            ))}
          </div>

          {/* Divider between global and minimized */}
          {items.length > 0 && (
            <div className="w-px h-8 bg-[var(--color-border-subtle)]" />
          )}

          {/* Minimized Instruments */}
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
                aria-label={`Restore ${item.title}`}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: `${categoryColors[item.category]}20`,
                    border: `2px solid ${categoryColors[item.category]}`,
                    boxShadow: `0 0 20px ${categoryColors[item.category]}40`,
                  }}
                >
                  <div style={{ color: categoryColors[item.category] }}>
                    {item.icon}
                  </div>
                </div>

                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.title}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
                </div>

                {/* Pulse indicator */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{
                    background: categoryColors[item.category],
                    boxShadow: `0 0 10px ${categoryColors[item.category]}`,
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
          {(items.length > 0 || globalInstruments.length > 0) && (
            <div className="w-px h-8 bg-[var(--color-border-subtle)]" />
          )}

          {/* Dock hint */}
          <div className="text-xs text-[var(--color-text-muted)] px-2">
            Global instruments • ⌘K for more
          </div>
        </div>
      </motion.div>
    </>
  );
}
