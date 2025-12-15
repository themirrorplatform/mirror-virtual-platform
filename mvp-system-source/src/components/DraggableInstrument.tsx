/**
 * Draggable Instrument - Enhanced floating panel with drag, resize, and stack management
 */

import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { X, Minimize2, Maximize2, Move, Minus } from 'lucide-react';

interface DraggableInstrumentProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  onMinimize?: () => void;
  id: string;
  category?: 'input' | 'reflection' | 'time' | 'identity' | 'commons' | 'sovereignty' | 'builder';
}

export function DraggableInstrument({ 
  children, 
  title, 
  icon,
  onClose,
  onMinimize,
  id,
  category = 'input',
}: DraggableInstrumentProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(30);
  const constraintsRef = useRef(null);
  
  // Dragging state
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Size state
  const defaultSize = { width: 600, height: 600 };
  const [size, setSize] = useState(defaultSize);

  // Category colors
  const categoryGlow = {
    input: 'rgba(203, 163, 93, 0.4)', // Gold
    reflection: 'rgba(147, 112, 219, 0.4)', // Violet
    time: 'rgba(100, 181, 246, 0.4)', // Blue
    identity: 'rgba(129, 212, 250, 0.4)', // Cyan
    commons: 'rgba(147, 112, 219, 0.4)', // Violet
    sovereignty: 'rgba(239, 68, 68, 0.4)', // Red
    builder: 'rgba(64, 224, 208, 0.4)', // Turquoise
  };

  // Depth effect based on z-index
  const blur = useTransform(
    () => zIndex,
    [0, 10],
    [2, 0]
  );

  const opacity = useTransform(
    () => zIndex,
    [0, 10],
    [0.7, 1]
  );

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      // Save current position for restore
      setSize({ width: window.innerWidth - 64, height: window.innerHeight - 64 });
      x.set(32);
      y.set(32);
    } else {
      setSize(defaultSize);
      x.set(0);
      y.set(0);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setZIndex(100);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    setZIndex(30);
    
    // Save position to localStorage
    const position = { x: info.point.x, y: info.point.y };
    localStorage.setItem(`instrument_${id}_position`, JSON.stringify(position));
  };

  const handleBringToFront = () => {
    setZIndex(100);
    setTimeout(() => setZIndex(30), 100);
  };

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem(`instrument_${id}_position`);
    if (saved) {
      try {
        const { x: savedX, y: savedY } = JSON.parse(saved);
        x.set(savedX);
        y.set(savedY);
      } catch (e) {
        // Invalid saved data
      }
    }
  }, [id]);

  return (
    <motion.div
      ref={constraintsRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
    >
      <motion.div
        drag={!isMaximized}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseDown={handleBringToFront}
        style={{ 
          x, 
          y,
          width: isMaximized ? size.width : defaultSize.width,
          height: isMaximized ? size.height : defaultSize.height,
        }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.23, 1, 0.32, 1],
        }}
        className="absolute pointer-events-auto"
      >
        <motion.div
          className="relative w-full h-full bg-[var(--color-surface-card)] backdrop-blur-2xl rounded-2xl overflow-hidden border flex flex-col"
          style={{
            borderColor: categoryGlow[category],
          }}
        >
          {/* Header - Draggable */}
          <div 
            className="px-6 py-4 flex items-center justify-between border-b cursor-move flex-shrink-0"
            style={{
              borderColor: `${categoryGlow[category]}40`,
              background: `linear-gradient(135deg, ${categoryGlow[category]}10, transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: isDragging ? 360 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <Move size={16} className="text-[var(--color-text-muted)]" />
              </motion.div>
              
              {icon && (
                <div 
                  className="p-2 rounded-lg"
                  style={{
                    background: `${categoryGlow[category]}20`,
                    color: categoryGlow[category],
                  }}
                >
                  {icon}
                </div>
              )}
              <h2 className="text-lg text-[var(--color-text-primary)]">
                {title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {onMinimize && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onMinimize}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
                  aria-label="Minimize to dock"
                >
                  <Minus size={18} />
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMaximize}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
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

          {/* Resize indicator (bottom-right corner) */}
          {!isMaximized && (
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize opacity-30 hover:opacity-60 transition-opacity"
              style={{
                background: `linear-gradient(135deg, transparent 50%, ${categoryGlow[category]} 50%)`,
              }}
            />
          )}
        </motion.div>

        {/* Ambient glow */}
        <motion.div
          className="absolute inset-0 -z-10 blur-3xl"
          animate={{
            opacity: isDragging ? 0.5 : 0.3,
          }}
          style={{
            background: `radial-gradient(circle at center, ${categoryGlow[category]}, transparent 70%)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}