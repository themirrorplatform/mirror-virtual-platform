import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NodeCardProps {
  id: string;
  text: string;
  timestamp: string;
  isExpanded?: boolean;
  hasTension?: boolean;
  tensionLabel?: string;
  onExpand?: (id: string) => void;
}

export function NodeCard({
  id,
  text,
  timestamp,
  isExpanded = false,
  hasTension = false,
  tensionLabel,
  onExpand,
}: NodeCardProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  
  const handleToggle = () => {
    const newState = !expanded;
    setExpanded(newState);
    if (onExpand) onExpand(id);
  };

  const preview = text.length > 120 ? text.slice(0, 120) + '...' : text;

  return (
    <div className="relative">
      {/* Tension indicator */}
      {hasTension && (
        <div className="absolute -left-10 top-6 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)]" 
               style={{ boxShadow: '0 0 10px var(--color-accent-gold)' }} 
          />
        </div>
      )}

      <button
        onClick={handleToggle}
        className="w-full text-left p-7 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors shadow-ambient-sm"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className="text-sm text-[var(--color-text-muted)]">
            {timestamp}
          </span>
          <div className="flex items-center gap-3">
            {hasTension && tensionLabel && (
              <span className="text-xs px-3 py-1 rounded-lg bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]">
                {tensionLabel}
              </span>
            )}
            {expanded ? (
              <ChevronUp size={18} className="text-[var(--color-text-muted)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--color-text-muted)]" />
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-base text-[var(--color-text-primary)] leading-[1.8] whitespace-pre-wrap"
            >
              {text}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-base text-[var(--color-text-secondary)] leading-[1.7]"
            >
              {preview}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}