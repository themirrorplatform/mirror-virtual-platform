import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, ChevronUp, Info, Shield, Eye, FileText, GitBranch, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export type Layer = 'sovereign' | 'commons' | 'builder';
export type Scope = 'local-only' | 'device-sync' | 'commons-shared' | 'public';
export type RecognitionState = 'recognized' | 'conditional' | 'suspended' | 'revoked' | 'unrecognized' | 'checking';

interface LayerHUDProps {
  layer: Layer;
  scope: Scope;
  recognitionState: RecognitionState;
  constitutionSet: string[];
  forkContext?: string;
  worldviewStack: string[];
  pendingSyncChanges?: number;
  onLayerChange?: (layer: Layer) => void;
  onViewConstitution?: () => void;
  onViewRecognition?: () => void;
  onViewWorldviews?: () => void;
  onViewFork?: () => void;
}

const layerConfig = {
  sovereign: {
    color: 'var(--color-accent-gold)',
    label: 'Sovereign',
    description: 'Private, local-only reflection',
    icon: Shield
  },
  commons: {
    color: 'var(--color-accent-purple)',
    label: 'Commons',
    description: 'Shared patterns, anonymous contribution',
    icon: Eye
  },
  builder: {
    color: 'var(--color-accent-red)',
    label: 'Builder',
    description: 'Constitutional editing and testing',
    icon: FileText
  }
};

const scopeLabels = {
  'local-only': 'Local Only',
  'device-sync': 'Multi-Device',
  'commons-shared': 'Commons',
  'public': 'Public'
};

const recognitionConfig = {
  recognized: { color: 'var(--color-success)', label: 'Recognized', pulse: false },
  conditional: { color: 'var(--color-warning)', label: 'Conditional', pulse: true },
  suspended: { color: 'var(--color-error)', label: 'Suspended', pulse: true },
  revoked: { color: 'var(--color-error)', label: 'Revoked', pulse: false },
  unrecognized: { color: 'var(--color-text-muted)', label: 'Unrecognized', pulse: false },
  checking: { color: 'var(--color-text-muted)', label: 'Checking...', pulse: true }
};

export function LayerHUD({
  layer,
  scope,
  recognitionState,
  constitutionSet,
  forkContext,
  worldviewStack,
  pendingSyncChanges = 0,
  onLayerChange,
  onViewConstitution,
  onViewRecognition,
  onViewWorldviews,
  onViewFork
}: LayerHUDProps) {
  const [expanded, setExpanded] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null);

  const currentLayer = layerConfig[layer];
  const CurrentLayerIcon = currentLayer.icon;
  const recognitionInfo = recognitionConfig[recognitionState];

  // Auto-collapse after 10 seconds of expansion
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => setExpanded(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  // Keyboard shortcut: L to toggle expansion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setExpanded(prev => !prev);
      }
      // Quick layer switching with numbers
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const layerMap: { [key: string]: Layer } = {
          '1': 'sovereign',
          '2': 'commons',
          '3': 'builder'
        };
        const targetLayer = layerMap[e.key];
        if (targetLayer && onLayerChange) {
          onLayerChange(targetLayer);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLayerChange]);

  return (
    <>
      {/* Compact HUD Bar - Always visible */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="fixed top-8 left-8 z-50"
        onMouseEnter={() => setExpanded(true)}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="group flex items-center gap-5 px-6 py-4 bg-[var(--color-surface-card)]/90 backdrop-blur-xl border border-[var(--color-border-subtle)] rounded-2xl hover:border-[var(--color-border-emphasis)] shadow-ambient-md shadow-hover-lift transition-all"
          aria-label="Layer HUD"
          aria-expanded={expanded}
        >
          {/* Layer Indicator */}
          <div className="flex items-center gap-4">
            <motion.div
              className="relative"
              animate={expanded ? { scale: 1.08 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <CurrentLayerIcon 
                size={22} 
                style={{ color: currentLayer.color }}
              />
              {/* Breathing pulse */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ 
                  backgroundColor: currentLayer.color,
                  opacity: 0.2
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0, 0.2]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
            
            <div>
              <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em] mb-1">
                Layer
              </div>
              <div 
                className="text-base font-medium tracking-wide"
                style={{ color: currentLayer.color }}
              >
                {currentLayer.label}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-[var(--color-border-subtle)]" />

          {/* Recognition State */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ 
                backgroundColor: recognitionConfig[recognitionState].color,
                boxShadow: `0 0 8px ${recognitionConfig[recognitionState].color}40`
              }}
              animate={{
                scale: recognitionState === 'verifying' ? [1, 1.2, 1] : 1,
                opacity: recognitionState === 'verifying' ? [1, 0.5, 1] : 1
              }}
              transition={{
                duration: 1.5,
                repeat: recognitionState === 'verifying' ? Infinity : 0
              }}
            />
            <span className="text-sm text-[var(--color-text-secondary)] tracking-wide">
              {recognitionConfig[recognitionState].label}
            </span>
          </div>

          {/* Sync Warning */}
          {pendingSyncChanges > 0 && (
            <>
              <div className="w-px h-10 bg-[var(--color-border-subtle)]" />
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  <AlertCircle size={16} className="text-[var(--color-warning)]" />
                </motion.div>
                <span className="text-xs text-[var(--color-warning)] font-medium">
                  {pendingSyncChanges} unsynced
                </span>
              </div>
            </>
          )}

          {/* Expand Indicator */}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="ml-3"
          >
            <ChevronDown size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
          </motion.div>
        </button>
      </motion.div>

      {/* Expanded Detail Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed top-28 left-8 z-40 w-[480px]"
            onMouseLeave={() => setExpanded(false)}
          >
            <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-ambient-xl overflow-hidden backdrop-blur-xl">
              {/* Layer Selection - enhanced spacing */}
              <div className="p-8 pb-7 border-b border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-emphasis)]/20 to-transparent">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Layers size={18} className="text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em] font-medium">Active Layer</span>
                  </div>
                  <kbd className="px-3.5 py-1.5 rounded-lg bg-[var(--color-surface-emphasis)] text-xs text-[var(--color-accent-gold)] font-mono border border-[var(--color-border-subtle)] shadow-ambient-sm">
                    ⌘L
                  </kbd>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {(Object.keys(layerConfig) as Layer[]).map((l) => {
                    const config = layerConfig[l];
                    const Icon = config.icon;
                    const isActive = l === layer;
                    const isHovered = l === hoveredLayer;

                    return (
                      <button
                        key={l}
                        onClick={() => {
                          if (onLayerChange && !isActive) {
                            onLayerChange(l);
                          }
                        }}
                        onMouseEnter={() => setHoveredLayer(l)}
                        onMouseLeave={() => setHoveredLayer(null)}
                        disabled={!onLayerChange || isActive}
                        className={`relative p-5 rounded-xl transition-all shadow-ambient-sm hover:shadow-ambient-md ${
                          isActive
                            ? 'bg-[var(--color-surface-emphasis)]'
                            : 'bg-[var(--color-surface-emphasis)]/50 hover:bg-[var(--color-surface-emphasis)]'
                        }`}
                        style={{
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderColor: isActive ? config.color : 'transparent'
                        }}
                        aria-label={`Switch to ${config.label} layer`}
                        aria-pressed={isActive}
                      >
                        <Icon 
                          size={20} 
                          style={{ color: config.color }}
                          className="mx-auto mb-3"
                        />
                        <div className="text-sm text-center text-[var(--color-text-primary)] font-medium tracking-wide">
                          {config.label}
                        </div>
                        
                        {/* Hover tooltip */}
                        <AnimatePresence>
                          {isHovered && !isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 px-4 py-2.5 rounded-xl bg-black/95 text-xs text-white text-center whitespace-normal z-50 shadow-ambient-md backdrop-blur-sm leading-relaxed"
                            >
                              {config.description}
                              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/95 rotate-45" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope - enhanced spacing */}
              <div className="p-8 py-7 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em] font-medium">Data Scope</span>
                  <span className="text-sm text-[var(--color-text-primary)] font-medium tracking-wide">{scopeLabels[scope]}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-emphasis)] rounded-full overflow-hidden shadow-inset-sm">
                  <motion.div
                    className="h-full shadow-sm"
                    style={{ 
                      backgroundColor: currentLayer.color,
                      width: scope === 'local-only' ? '25%' : scope === 'device-sync' ? '50%' : scope === 'commons-shared' ? '75%' : '100%'
                    }}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: scope === 'local-only' ? '25%' : scope === 'device-sync' ? '50%' : scope === 'commons-shared' ? '75%' : '100%'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Recognition Status */}
              <button
                onClick={onViewRecognition}
                className="w-full p-7 py-6 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors text-left group"
                aria-label="View recognition details"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Recognition</span>
                  {onViewRecognition && (
                    <Info size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: recognitionInfo.color }}
                    animate={recognitionInfo.pulse ? { 
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.6, 1]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-base font-medium" style={{ color: recognitionInfo.color }}>
                    {recognitionInfo.label}
                  </span>
                </div>
              </button>

              {/* Constitution Set */}
              <button
                onClick={onViewConstitution}
                className="w-full p-7 py-6 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors text-left group"
                aria-label="View active constitutions"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Constitutions ({constitutionSet.length})</span>
                  {onViewConstitution && (
                    <Info size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors" />
                  )}
                </div>
                <div className="space-y-2">
                  {constitutionSet.slice(0, 3).map((constitution, i) => (
                    <div key={i} className="text-sm text-[var(--color-text-secondary)] truncate leading-relaxed">
                      • {constitution}
                    </div>
                  ))}
                  {constitutionSet.length > 3 && (
                    <div className="text-sm text-[var(--color-text-muted)] mt-1">
                      +{constitutionSet.length - 3} more
                    </div>
                  )}
                </div>
              </button>

              {/* Fork Context */}
              {forkContext && (
                <button
                  onClick={onViewFork}
                  className="w-full p-7 py-6 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors text-left group"
                  aria-label="View fork context"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <GitBranch size={14} className="text-[var(--color-accent-gold)]" />
                      <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Fork Context</span>
                    </div>
                    {onViewFork && (
                      <Info size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors" />
                    )}
                  </div>
                  <div className="text-base text-[var(--color-accent-gold)] font-medium">{forkContext}</div>
                </button>
              )}

              {/* Worldview Stack */}
              {worldviewStack.length > 0 && (
                <button
                  onClick={onViewWorldviews}
                  className="w-full p-7 py-6 hover:bg-[var(--color-surface-emphasis)] transition-colors text-left group"
                  aria-label="View active worldviews"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Eye size={14} className="text-[var(--color-accent-purple)]" />
                      <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Worldviews ({worldviewStack.length})</span>
                    </div>
                    {onViewWorldviews && (
                      <Info size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {worldviewStack.slice(0, 4).map((worldview, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-accent-purple)]/10 text-sm text-[var(--color-accent-purple)]"
                      >
                        {worldview}
                      </div>
                    ))}
                    {worldviewStack.length > 4 && (
                      <div className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-emphasis)] text-sm text-[var(--color-text-muted)]">
                        +{worldviewStack.length - 4}
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}