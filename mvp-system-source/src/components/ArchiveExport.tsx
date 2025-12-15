import { useState } from 'react';
import { Download, FileText, FileJson, Calendar, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { motion } from 'motion/react';

interface ExportOptions {
  format: 'json' | 'markdown' | 'pdf';
  dateRange: 'all' | 'year' | 'month' | 'custom';
  includeThreads: boolean;
  includeShared: boolean;
  startDate?: string;
  endDate?: string;
}

interface ArchiveExportProps {
  onExport: (options: ExportOptions) => void;
  isExporting?: boolean;
}

export function ArchiveExport({
  onExport,
  isExporting = false,
}: ArchiveExportProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    dateRange: 'all',
    includeThreads: true,
    includeShared: true,
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = () => {
    onExport(options);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="mb-2">Export Your Data</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Your reflections belong to you. Export them in any format, anytime.
        </p>
      </div>

      {/* Format selection */}
      <div className="space-y-3">
        <label className="block text-sm text-[var(--color-text-muted)]">
          Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setOptions({ ...options, format: 'json' })}
            className={`p-4 rounded-lg border transition-colors ${
              options.format === 'json'
                ? 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
                : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)]/50'
            }`}
          >
            <FileJson size={24} className="mx-auto mb-2" />
            <div className="text-sm">JSON</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              Machine-readable
            </div>
          </button>

          <button
            onClick={() => setOptions({ ...options, format: 'markdown' })}
            className={`p-4 rounded-lg border transition-colors ${
              options.format === 'markdown'
                ? 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
                : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)]/50'
            }`}
          >
            <FileText size={24} className="mx-auto mb-2" />
            <div className="text-sm">Markdown</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              Human-readable
            </div>
          </button>

          <button
            onClick={() => setOptions({ ...options, format: 'pdf' })}
            className={`p-4 rounded-lg border transition-colors ${
              options.format === 'pdf'
                ? 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
                : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)]/50'
            }`}
          >
            <FileText size={24} className="mx-auto mb-2" />
            <div className="text-sm">PDF</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              Printable
            </div>
          </button>
        </div>
      </div>

      {/* Date range selection */}
      <div className="space-y-3">
        <label className="block text-sm text-[var(--color-text-muted)]">
          Time range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setOptions({ ...options, dateRange: 'all' })}
            className={`p-3 rounded-lg border transition-colors text-left ${
              options.dateRange === 'all'
                ? 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
                : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)]/50'
            }`}
          >
            All time
          </button>
          <button
            onClick={() => setOptions({ ...options, dateRange: 'year' })}
            className={`p-3 rounded-lg border transition-colors text-left ${
              options.dateRange === 'year'
                ? 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
                : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)]/50'
            }`}
          >
            Past year
          </button>
          <button
            onClick={() => setOptions({ ...options, dateRange: 'month' })}
            className={`p-3 rounded-lg border transition-colors text-left ${
              options.dateRange === 'month'
                ? 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
                : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)]/50'
            }`}
          >
            Past month
          </button>
          <button
            onClick={() => setOptions({ ...options, dateRange: 'custom' })}
            className={`p-3 rounded-lg border transition-colors text-left ${
              options.dateRange === 'custom'
                ? 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
                : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-gold)]/50'
            }`}
          >
            Custom range
          </button>
        </div>

        {/* Custom date inputs */}
        {options.dateRange === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-3 mt-3"
          >
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                Start date
              </label>
              <input
                type="date"
                value={options.startDate || ''}
                onChange={(e) => setOptions({ ...options, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                End date
              </label>
              <input
                type="date"
                value={options.endDate || ''}
                onChange={(e) => setOptions({ ...options, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Include options */}
      <div className="space-y-3">
        <label className="block text-sm text-[var(--color-text-muted)]">
          Include
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] cursor-pointer hover:border-[var(--color-accent-gold)]/50 transition-colors">
            <input
              type="checkbox"
              checked={options.includeThreads}
              onChange={(e) => setOptions({ ...options, includeThreads: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--color-border-subtle)] bg-transparent"
            />
            <div className="flex-1">
              <div className="text-sm text-[var(--color-text-primary)]">
                Thread connections
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Include thread links and relationships
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] cursor-pointer hover:border-[var(--color-accent-gold)]/50 transition-colors">
            <input
              type="checkbox"
              checked={options.includeShared}
              onChange={(e) => setOptions({ ...options, includeShared: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--color-border-subtle)] bg-transparent"
            />
            <div className="flex-1">
              <div className="text-sm text-[var(--color-text-primary)]">
                Commons activity
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Include shared posts and responses
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Export button */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
        <div className="text-xs text-[var(--color-text-muted)]">
          Your data will download immediately
        </div>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download size={16} />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>

      {/* Success message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-2 p-4 rounded-lg bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]"
        >
          <CheckCircle size={18} />
          <span className="text-sm">Export complete</span>
        </motion.div>
      )}

      {/* Privacy note */}
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Exports are generated locally and never sent to external servers. 
          Your data remains entirely under your control.
        </p>
      </div>
    </div>
  );
}
