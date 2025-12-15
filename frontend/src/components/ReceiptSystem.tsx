/**
 * Receipt System - Constitutional Transparency
 * Replaces toast notifications with neutral, expandable receipts
 * Shows state changes and actions taken by the system
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Receipt } from '../hooks/useMirrorState';

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

  // Show only the 3 most recent receipts
  const recentReceipts = (receipts || []).slice(-3).reverse();

  return (
    <div className="fixed bottom-6 left-6 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {recentReceipts.map((receipt) => (
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
      className="bg-[var(--color-surface-card)] backdrop-blur-md border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-lg"
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        <FileText size={16} className="text-[var(--color-text-muted)]" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-[var(--color-text-primary)]">{receipt.title}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {formatTimestamp(receipt.timestamp)}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 rounded hover:bg-white/10 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--color-border-subtle)]"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">
                Type: <span className="text-[var(--color-text-secondary)]">{receipt.type}</span>
              </div>
              
              {Object.keys(receipt.details).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(receipt.details).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-[var(--color-text-muted)]">{key}:</span>{' '}
                      <span className="text-[var(--color-text-secondary)]">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}
