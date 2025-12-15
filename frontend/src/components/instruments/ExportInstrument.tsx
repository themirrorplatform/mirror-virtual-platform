/**
 * Export Instrument
 * Complete data export with integrity receipts
 * Equal weight formats, no "recommended"
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, FileText, Lock, AlertCircle, X } from 'lucide-react';

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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-8"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl p-8 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check size={32} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-[var(--color-text-primary)]">Export Complete</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Your data has been exported with integrity verification</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">File size</span>
                <span className="text-[var(--color-text-primary)]">{receipt.fileSize}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Checksum</span>
                <span className="text-[var(--color-text-primary)] font-mono text-xs">{receipt.checksum}</span>
              </div>
              {receipt.encrypted && (
                <div className="flex justify-between p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)]">Encryption</span>
                  <span className="text-green-400">Enabled</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] hover:opacity-90 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div>
              <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Export</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Download your data with integrity verification
              </p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Scope selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">What to export</h3>
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
                  <h4 className="text-sm mb-1 text-[var(--color-text-primary)]">{scope.label}</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {scope.description} • {scope.estimatedSize}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Format selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Export format</h3>
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
                  <h4 className="text-sm mb-1 text-[var(--color-text-primary)]">{format.name}</h4>
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">{format.description}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Preserves: {format.preserves.join(', ')}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Encryption */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Encryption</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
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
                <h4 className="text-sm mb-1 text-[var(--color-text-primary)]">Unencrypted</h4>
                <p className="text-xs text-[var(--color-text-muted)]">Export in plain format</p>
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
                  <Lock size={14} className="text-[var(--color-accent-gold)]" />
                  <h4 className="text-sm text-[var(--color-text-primary)]">Encrypted</h4>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Password-protected AES-256</p>
              </button>
            </div>

            {encrypted && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="w-full px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}


