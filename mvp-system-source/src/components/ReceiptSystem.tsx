/**
 * Receipt System - Replaces toast notifications
 * Neutral. Expandable. No celebration.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface Receipt {
  id: string;
  type: 'layer_switch' | 'license' | 'constitution' | 'export' | 'fork_entry' | 'worldview' | 'conflict_resolution';
  title: string;
  timestamp: Date;
  details: Record<string, any>;
}

interface ReceiptSystemProps {
  receipts: Receipt[];
  onDismiss: (id: string) => void;
}

export function ReceiptSystem({ receipts, onDismiss }: ReceiptSystemProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-collapse after 5 seconds
  useEffect(() => {
    if (expandedId) {
      const timer = setTimeout(() => setExpandedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [expandedId]);

  return (
    <div className="fixed bottom-6 left-6 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {receipts.slice(-3).map((receipt) => (
          <ReceiptChip
            key={receipt.id}
            receipt={receipt}
            expanded={expandedId === receipt.id}
            onToggle={() => setExpandedId(expandedId === receipt.id ? null : receipt.id)}
            onDismiss={() => onDismiss(receipt.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ReceiptChip({
  receipt,
  expanded,
  onToggle,
  onDismiss,
}: {
  receipt: Receipt;
  expanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-[var(--color-surface-card)] backdrop-blur-md border border-[var(--color-border-subtle)] rounded-xl overflow-hidden"
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        <FileText size={16} className="text-[var(--color-text-muted)]" />
        <div className="flex-1 text-left">
          <div className="text-sm text-[var(--color-text-primary)]">{receipt.title}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {formatTimestamp(receipt.timestamp)}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
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
            <div className="px-4 pb-3 pt-1 border-t border-white/5 space-y-2">
              {Object.entries(receipt.details).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <div className="text-[var(--color-text-muted)] capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[var(--color-text-secondary)] font-mono">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper to create receipts
export function createReceipt(
  type: Receipt['type'],
  title: string,
  details: Record<string, any>
): Receipt {
  return {
    id: `receipt_${Date.now()}_${Math.random()}`,
    type,
    title,
    timestamp: new Date(),
    details,
  };
}