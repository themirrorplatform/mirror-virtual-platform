/**
 * Privacy Dashboard Instrument
 * Enhanced constitutional transparency
 * Shows all data flows and processing
 */

import { motion } from 'framer-motion';
import { Shield, Eye, Database, Lock, Globe, AlertCircle, X } from 'lucide-react';

interface DataFlow {
  category: string;
  local: number;
  aggregated: number;
  shared: number;
}

interface PrivacyDashboardInstrumentProps {
  layer: 'sovereign' | 'commons' | 'builder';
  dataFlows: DataFlow[];
  totalReflections: number;
  encryptionEnabled: boolean;
  anonymizationLevel: 'none' | 'partial' | 'full';
  onClose: () => void;
}

export function PrivacyDashboardInstrument({
  layer,
  dataFlows,
  totalReflections,
  encryptionEnabled,
  anonymizationLevel,
  onClose,
}: PrivacyDashboardInstrumentProps) {
  const layerColors = {
    sovereign: 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10',
    commons: 'text-purple-400 bg-purple-500/10',
    builder: 'text-[var(--color-accent-turquoise)] bg-[var(--color-accent-turquoise)]/10',
  };

  const anonymizationConfig = {
    none: { label: 'None', color: 'text-red-400', description: 'No anonymization applied' },
    partial: { label: 'Partial', color: 'text-yellow-400', description: 'Identifying details removed' },
    full: { label: 'Full', color: 'text-green-400', description: 'Complete anonymization' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${layerColors[layer]} flex items-center justify-center`}>
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Privacy Dashboard</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Constitutional transparency for all data flows
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current layer notice */}
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                You are in <span className="capitalize font-medium text-[var(--color-text-primary)]">{layer}</span> mode.
                {layer === 'sovereign' && ' All data stays local.'}
                {layer === 'commons' && ' Anonymized patterns may be aggregated.'}
                {layer === 'builder' && ' Experimental features active.'}
              </div>
            </div>
          </div>

          {/* Privacy metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-green-400" />
                <span className="text-sm text-[var(--color-text-muted)]">Encryption</span>
              </div>
              <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {encryptionEnabled ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={16} className={anonymizationConfig[anonymizationLevel].color} />
                <span className="text-sm text-[var(--color-text-muted)]">Anonymization</span>
              </div>
              <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {anonymizationConfig[anonymizationLevel].label}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} className="text-blue-400" />
                <span className="text-sm text-[var(--color-text-muted)]">Total Data</span>
              </div>
              <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {totalReflections}
              </div>
            </div>
          </div>

          {/* Data flows */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Data Flows by Category</h3>
            <div className="space-y-3">
              {dataFlows.map((flow, index) => {
                const total = flow.local + flow.aggregated + flow.shared;
                const localPct = total > 0 ? (flow.local / total) * 100 : 0;
                const aggPct = total > 0 ? (flow.aggregated / total) * 100 : 0;
                const sharedPct = total > 0 ? (flow.shared / total) * 100 : 0;

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{flow.category}</span>
                      <span className="text-sm text-[var(--color-text-muted)]">{total} items</span>
                    </div>

                    {/* Stacked progress bar */}
                    <div className="flex h-2 rounded-full overflow-hidden bg-[var(--color-surface-card)]">
                      {localPct > 0 && (
                        <div
                          className="bg-green-500"
                          style={{ width: `${localPct}%` }}
                          title={`${flow.local} local`}
                        />
                      )}
                      {aggPct > 0 && (
                        <div
                          className="bg-yellow-500"
                          style={{ width: `${aggPct}%` }}
                          title={`${flow.aggregated} aggregated`}
                        />
                      )}
                      {sharedPct > 0 && (
                        <div
                          className="bg-orange-500"
                          style={{ width: `${sharedPct}%` }}
                          title={`${flow.shared} shared`}
                        />
                      )}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-green-500" />
                        <span className="text-[var(--color-text-muted)]">Local: {flow.local}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                        <span className="text-[var(--color-text-muted)]">Aggregated: {flow.aggregated}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-orange-500" />
                        <span className="text-[var(--color-text-muted)]">Shared: {flow.shared}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What each level means */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-green-400" />
                <h4 className="text-sm font-medium text-green-400">Local</h4>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Stays on your device. Never leaves.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} className="text-yellow-400" />
                <h4 className="text-sm font-medium text-yellow-400">Aggregated</h4>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Anonymized patterns only. No raw data.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="text-orange-400" />
                <h4 className="text-sm font-medium text-orange-400">Shared</h4>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Explicitly shared with others.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export const EXAMPLE_DATA_FLOWS: DataFlow[] = [
  { category: 'Reflections', local: 245, aggregated: 0, shared: 3 },
  { category: 'Identity Nodes', local: 18, aggregated: 0, shared: 0 },
  { category: 'Threads', local: 42, aggregated: 0, shared: 8 },
  { category: 'Worldviews', local: 5, aggregated: 0, shared: 0 },
];

