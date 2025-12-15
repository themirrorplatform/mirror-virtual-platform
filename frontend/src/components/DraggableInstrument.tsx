/**
 * Draggable Instrument - Floating panel with drag and close
 */

import { ReactNode, useState, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X, Move, Maximize2, Minimize2 } from 'lucide-react';

interface DraggableInstrumentProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  id: string;
  defaultPosition?: { x: number; y: number };
}

export function DraggableInstrument({ 
  children, 
  title, 
  icon,
  onClose,
  id,
  defaultPosition = { x: 100, y: 100 }
}: DraggableInstrumentProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <motion.div
      ref={constraintsRef}
      className="fixed inset-0 pointer-events-none z-40"
    >
      <motion.div
        drag={!isMaximized}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        initial={{ opacity: 0, scale: 0.95, ...defaultPosition }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          width: isMaximized ? 'calc(100vw - 64px)' : 600,
          height: isMaximized ? 'calc(100vh - 64px)' : 600,
          x: isMaximized ? 32 : defaultPosition.x,
          y: isMaximized ? 32 : defaultPosition.y,
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.23, 1, 0.32, 1],
        }}
        className="absolute pointer-events-auto"
      >
        <div className="relative w-full h-full bg-[#0F1419] backdrop-blur-2xl rounded-2xl overflow-hidden border border-[#2A2D35] flex flex-col shadow-2xl">
          {/* Header - Draggable */}
          <div 
            className="px-6 py-4 flex items-center justify-between border-b border-[#2A2D35] cursor-move flex-shrink-0 bg-gradient-to-r from-[#CBA35D]/10 to-transparent"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: isDragging ? 360 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <Move size={16} className="text-[#9CA3AF]" />
              </motion.div>
              
              {icon && (
                <div className="p-2 rounded-lg bg-[#CBA35D]/20 text-[#CBA35D]">
                  {icon}
                </div>
              )}
              <h2 className="text-lg text-[#F3F4F6]">
                {title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMaximize}
                className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 transition-all"
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 transition-all"
                aria-label="Close"
              >
                <X size={18} />
              </motion.button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar p-6">
              {children}
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div
          className="absolute inset-0 -z-10 blur-3xl opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(203, 163, 93, 0.4), transparent 70%)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
