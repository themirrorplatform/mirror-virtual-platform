/**
 * Worldview Lens Instrument
 * Stackable interpretive lenses that reframe reflection
 * Each lens has assumptions, exclusions, and licensing
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Layers, Pause, Trash2, Plus, AlertCircle, FileText } from 'lucide-react';

interface Worldview {
  id: string;
  name: string;
  description: string;
  origin: 'user' | 'system' | 'commons' | 'fork';
  assumptions: string[];
  exclusions: string[];
  license?: string;
  active: boolean;
  order: number; // Stack position
}

interface WorldviewLensInstrumentProps {
  worldviews: Worldview[];
  availableWorldviews: Worldview[];
  onApply: (worldviewId: string) => void;
  onPause: (worldviewId: string) => void;
  onRemove: (worldviewId: string) => void;
  onReorder: (worldviewIds: string[]) => void;
  onViewLicense?: (licenseId: string) => void;
  onClose: () => void;
}

export function WorldviewLensInstrument({
  worldviews,
  availableWorldviews,
  onApply,
  onPause,
  onRemove,
  onReorder,
  onViewLicense,
  onClose,
}: WorldviewLensInstrumentProps) {
  const [view, setView] = useState<'active' | 'available'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeWorldviews = worldviews
    .filter(w => w.active)
    .sort((a, b) => a.order - b.order);

  const pausedWorldviews = worldviews.filter(w => !w.active);

  const originColor = {
    user: 'text-blue-400',
    system: 'text-[var(--color-accent-gold)]',
    commons: 'text-purple-400',
    fork: 'text-cyan-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="mb-1">Worldview Lenses</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {activeWorldviews.length} active • {pausedWorldviews.length} paused
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* View tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('active')}
              className={`
                px-4 py-2 rounded-lg text-sm transition-all
                ${view === 'active'
                  ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                }
              `}
            >
              Active Stack
            </button>
            <button
              onClick={() => setView('available')}
              className={`
                px-4 py-2 rounded-lg text-sm transition-all
                ${view === 'available'
                  ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                }
              `}
            >
              Available
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'active' && (
            <ActiveStackView
              activeWorldviews={activeWorldviews}
              pausedWorldviews={pausedWorldviews}
              expandedId={expandedId}
              onToggleExpand={setExpandedId}
              onPause={onPause}
              onRemove={onRemove}
              onViewLicense={onViewLicense}
              originColor={originColor}
            />
          )}

          {view === 'available' && (
            <AvailableView
              availableWorldviews={availableWorldviews}
              expandedId={expandedId}
              onToggleExpand={setExpandedId}
              onApply={onApply}
              onViewLicense={onViewLicense}
              originColor={originColor}
            />
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
            <Layers size={16} className="mt-0.5" />
            <p>
              Worldviews stack from top to bottom. Each lens reframes what the ones below it produce.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActiveStackView({
  activeWorldviews,
  pausedWorldviews,
  expandedId,
  onToggleExpand,
  onPause,
  onRemove,
  onViewLicense,
  originColor,
}: any) {
  return (
    <div className="space-y-6">
      {/* Active stack */}
      {activeWorldviews.length > 0 ? (
        <div>
          <h3 className="mb-4 flex items-center gap-2">
            <Layers size={18} />
            <span>Active Stack</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              (top to bottom)
            </span>
          </h3>
          <div className="space-y-3">
            {activeWorldviews.map((worldview: Worldview, index: number) => (
              <WorldviewCard
                key={worldview.id}
                worldview={worldview}
                stackPosition={index + 1}
                expanded={expandedId === worldview.id}
                onToggleExpand={() => onToggleExpand(expandedId === worldview.id ? null : worldview.id)}
                onPause={() => onPause(worldview.id)}
                onRemove={() => onRemove(worldview.id)}
                onViewLicense={onViewLicense}
                originColor={originColor}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          No active worldviews
        </div>
      )}

      {/* Paused worldviews */}
      {pausedWorldviews.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2">
            <Pause size={18} />
            <span>Paused</span>
          </h3>
          <div className="space-y-3">
            {pausedWorldviews.map((worldview: Worldview) => (
              <WorldviewCard
                key={worldview.id}
                worldview={worldview}
                paused
                expanded={expandedId === worldview.id}
                onToggleExpand={() => onToggleExpand(expandedId === worldview.id ? null : worldview.id)}
                onRemove={() => onRemove(worldview.id)}
                onViewLicense={onViewLicense}
                originColor={originColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvailableView({
  availableWorldviews,
  expandedId,
  onToggleExpand,
  onApply,
  onViewLicense,
  originColor,
}: any) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
          <div className="text-sm text-[var(--color-text-secondary)]">
            Applying a worldview changes how reflections are interpreted. Review assumptions and exclusions.
          </div>
        </div>
      </div>

      {availableWorldviews.length > 0 ? (
        <div className="space-y-3">
          {availableWorldviews.map((worldview: Worldview) => (
            <WorldviewCard
              key={worldview.id}
              worldview={worldview}
              available
              expanded={expandedId === worldview.id}
              onToggleExpand={() => onToggleExpand(expandedId === worldview.id ? null : worldview.id)}
              onApply={() => onApply(worldview.id)}
              onViewLicense={onViewLicense}
              originColor={originColor}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          No available worldviews
        </div>
      )}
    </div>
  );
}

function WorldviewCard({
  worldview,
  stackPosition,
  paused,
  available,
  expanded,
  onToggleExpand,
  onPause,
  onRemove,
  onApply,
  onViewLicense,
  originColor,
}: any) {
  return (
    <div className={`
      rounded-xl border-2 overflow-hidden transition-all
      ${paused ? 'border-[var(--color-border-subtle)] opacity-50' : 'border-[var(--color-accent-gold)]/30'}
      ${available ? 'border-[var(--color-border-subtle)]' : ''}
    `}>
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-gold)]/10 flex items-center justify-center flex-shrink-0">
            {stackPosition ? (
              <span className="text-sm font-mono">{stackPosition}</span>
            ) : (
              <Eye size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="mb-1">{worldview.name}</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {worldview.description}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={originColor[worldview.origin]}>
                {worldview.origin}
              </span>
              {worldview.license && (
                <>
                  <span>•</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewLicense?.(worldview.license);
                    }}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline"
                  >
                    licensed
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!available && onPause && !paused && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPause();
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Pause"
              >
                <Pause size={16} />
              </button>
            )}
            {!available && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            )}
            {available && onApply && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApply();
                }}
                className="p-2 rounded-lg bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] hover:opacity-80 transition-opacity"
                aria-label="Apply"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Assumptions */}
              {worldview.assumptions.length > 0 && (
                <div>
                  <h5 className="text-sm mb-2 text-[var(--color-text-muted)]">Assumptions</h5>
                  <ul className="space-y-1">
                    {worldview.assumptions.map((assumption: string, i: number) => (
                      <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                        <span className="text-[var(--color-accent-gold)]">•</span>
                        <span>{assumption}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exclusions */}
              {worldview.exclusions.length > 0 && (
                <div>
                  <h5 className="text-sm mb-2 text-[var(--color-text-muted)]">Exclusions</h5>
                  <ul className="space-y-1">
                    {worldview.exclusions.map((exclusion: string, i: number) => (
                      <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>{exclusion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Example worldviews
export const EXAMPLE_WORLDVIEWS: Worldview[] = [
  {
    id: 'stoicism',
    name: 'Stoicism',
    description: 'Focuses on what is within your control vs beyond it',
    origin: 'commons',
    assumptions: [
      'There is a clear distinction between what you control and what you don\'t',
      'Focusing on what you control reduces suffering',
      'Virtue is the highest good',
    ],
    exclusions: [
      'Does not address systemic constraints',
      'May minimize emotional validity',
      'Assumes individual agency',
    ],
    license: 'Stoic Worldview License v1.0',
    active: false,
    order: 0,
  },
  {
    id: 'growth-mindset',
    name: 'Growth Mindset',
    description: 'Frames challenges as opportunities for development',
    origin: 'system',
    assumptions: [
      'Abilities can be developed through effort',
      'Failure is feedback, not identity',
      'Process matters more than outcome',
    ],
    exclusions: [
      'May minimize structural barriers',
      'Can create pressure to always be "growing"',
      'Assumes growth is always possible',
    ],
    active: false,
    order: 0,
  },
];