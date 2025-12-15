/**
 * Export Instrument
 * Complete data export with integrity receipts
 * Equal weight formats, no "recommended"
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, FileText, Lock, AlertCircle, Copy } from 'lucide-react';

interface ExportScope {
  id: string;
  label: string;
  description: string;
  estimatedSize: string;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  preserves: string[];
}

interface ExportInstrumentProps {
  onExport: (config: ExportConfig) => Promise<ExportReceipt>;
  onClose: () => void;
}

interface ExportConfig {
  scope: string;
  format: string;
  encrypted: boolean;
  password?: string;
}

interface ExportReceipt {
  id: string;
  timestamp: Date;
  scope: string;
  format: string;
  fileSize: string;
  checksum: string;
  signature?: string;
  encrypted: boolean;
}

export function ExportInstrument({ onExport, onClose }: ExportInstrumentProps) {
  const [selectedScope, setSelectedScope] = useState<string>('all-reflections');
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [encrypted, setEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [exporting, setExporting] = useState(false);
  const [receipt, setReceipt] = useState<ExportReceipt | null>(null);

  const scopes: ExportScope[] = [
    {
      id: 'all-reflections',
      label: 'All Reflections',
      description: 'Complete reflection history',
      estimatedSize: '~2.3 MB',
    },
    {
      id: 'threads',
      label: 'All Threads',
      description: 'Thread structure and connections',
      estimatedSize: '~500 KB',
    },
    {
      id: 'identity-graph',
      label: 'Identity Graph',
      description: 'Complete identity nodes and relationships',
      estimatedSize: '~1.1 MB',
    },
    {
      id: 'worldviews',
      label: 'Worldviews & Lenses',
      description: 'User-created and applied worldviews',
      estimatedSize: '~200 KB',
    },
    {
      id: 'forks',
      label: 'Forks & Variants',
      description: 'Created forks and constitutions',
      estimatedSize: '~800 KB',
    },
    {
      id: 'everything',
      label: 'Complete Archive',
      description: 'Everything in your Mirror',
      estimatedSize: '~5.0 MB',
    },
  ];

  const formats: ExportFormat[] = [
    {
      id: 'json',
      name: 'JSON',
      extension: '.json',
      description: 'Structured data format',
      preserves: ['Full metadata', 'Timestamps', 'Relationships', 'Provenance'],
    },
    {
      id: 'markdown',
      name: 'Markdown',
      extension: '.md',
      description: 'Human-readable text',
      preserves: ['Text content', 'Basic structure', 'Timestamps'],
    },
    {
      id: 'pdf',
      name: 'PDF',
      extension: '.pdf',
      description: 'Print-ready document',
      preserves: ['Visual formatting', 'Text content', 'Timestamps'],
    },
    {
      id: 'zip',
      name: 'ZIP Archive',
      extension: '.zip',
      description: 'All formats bundled',
      preserves: ['Everything', 'Multiple formats', 'Complete fidelity'],
    },
  ];

  const handleExport = async () => {
    if (encrypted && password !== confirmPassword) {
      return;
    }

    setExporting(true);

    try {
      const config: ExportConfig = {
        scope: selectedScope,
        format: selectedFormat,
        encrypted,
        password: encrypted ? password : undefined,
      };

      const exportReceipt = await onExport(config);
      setReceipt(exportReceipt);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const canExport = !exporting && (!encrypted || (password && password === confirmPassword));

  // Show receipt if export completed
  if (receipt) {
    return (
      <ExportReceiptView
        receipt={receipt}
        onClose={onClose}
        onExportAgain={() => setReceipt(null)}
      />
    );
  }

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
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-1">Export</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Download your data with integrity verification
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Scope selection */}
          <div>
            <h3 className="mb-4">What to export</h3>
            <div className="grid grid-cols-2 gap-3">
              {scopes.map((scope) => (
                <button
                  key={scope.id}
                  onClick={() => setSelectedScope(scope.id)}
                  className={`
                    p-4 rounded-xl text-left border-2 transition-all
                    ${selectedScope === scope.id
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm">{scope.label}</h4>
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${selectedScope === scope.id ? 'border-[var(--color-accent-gold)]' : 'border-[var(--color-border-subtle)]'}
                    `}>
                      {selectedScope === scope.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)]" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">
                    {scope.description}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {scope.estimatedSize}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Format selection (equal weight) */}
          <div>
            <h3 className="mb-4">Export format</h3>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`
                    p-4 rounded-xl text-left border-2 transition-all
                    ${selectedFormat === format.id
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm">{format.name}</h4>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {format.extension}
                      </p>
                    </div>
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${selectedFormat === format.id ? 'border-[var(--color-accent-gold)]' : 'border-[var(--color-border-subtle)]'}
                    `}>
                      {selectedFormat === format.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)]" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                    {format.description}
                  </p>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    Preserves: {format.preserves.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Encryption (equal weight option) */}
          <div>
            <h3 className="mb-4">Encryption</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEncrypted(false)}
                className={`
                  p-4 rounded-xl text-left border-2 transition-all
                  ${!encrypted
                    ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                  }
                `}
              >
                <h4 className="text-sm mb-1">Unencrypted</h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Export in plain format
                </p>
              </button>
              <button
                onClick={() => setEncrypted(true)}
                className={`
                  p-4 rounded-xl text-left border-2 transition-all
                  ${encrypted
                    ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={14} />
                  <h4 className="text-sm">Encrypted</h4>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Password-protected export
                </p>
              </button>
            </div>

            {encrypted && (
              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

          {/* License implications */}
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                Exported data includes checksums for integrity verification. You retain full ownership and control.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Return
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Export receipt view
function ExportReceiptView({
  receipt,
  onClose,
  onExportAgain,
}: {
  receipt: ExportReceipt;
  onClose: () => void;
  onExportAgain: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyChecksum = () => {
    navigator.clipboard.writeText(receipt.checksum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Check size={24} className="text-green-400" />
            </div>
            <div>
              <h2>Export Complete</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Your data has been exported
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">Scope</div>
              <div>{receipt.scope}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">Format</div>
              <div className="uppercase">{receipt.format}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">File size</div>
              <div>{receipt.fileSize}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">Timestamp</div>
              <div>{receipt.timestamp.toLocaleString()}</div>
            </div>
          </div>

          {receipt.encrypted && (
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm text-green-400">
              <Lock size={14} className="inline mr-2" />
              Export is encrypted
            </div>
          )}

          <div>
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Checksum (SHA-256)</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-mono overflow-x-auto">
                {receipt.checksum}
              </code>
              <button
                onClick={copyChecksum}
                className="p-2 rounded-lg bg-[var(--color-surface-card)] hover:bg-white/10 transition-colors"
                aria-label="Copy checksum"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {receipt.signature && (
            <div>
              <div className="text-sm text-[var(--color-text-muted)] mb-2">Signature</div>
              <code className="block px-3 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-mono overflow-x-auto">
                {receipt.signature}
              </code>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 text-sm text-[var(--color-text-secondary)]">
            <FileText size={16} className="inline mr-2" />
            Save this receipt to verify export integrity later
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)] flex gap-3">
          <button
            onClick={onExportAgain}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Export Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] transition-all"
          >
            Return to Field
          </button>
        </div>
      </div>
    </motion.div>
  );
}
