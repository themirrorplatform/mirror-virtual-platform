import { motion, AnimatePresence } from 'motion/react';
import { Download, Copy, Check, Lock, Unlock, FileText, Package, Eye, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useState } from 'react';

type ExportScope = 'reflection' | 'thread' | 'graph' | 'archive-full' | 'fork' | 'worldview' | 'constitution';
type ExportFormat = 'json' | 'markdown' | 'pdf' | 'zip';
type EncryptionStrength = 'none' | 'standard' | 'strong';

interface DownloadExportInstrumentProps {
  scope: ExportScope;
  scopeDescription: string;
  itemCount?: number;
  estimatedSize?: string;
  onExport: (format: ExportFormat, encryption: EncryptionStrength) => Promise<{
    checksum: string;
    size: string;
    timestamp: string;
    filename: string;
  }>;
  licenseText: string;
  licenseImplications: string;
  onClose: () => void;
}

const formatConfig: Record<ExportFormat, { icon: typeof FileText; label: string; description: string; preview: string }> = {
  json: {
    icon: FileText,
    label: 'JSON',
    description: 'Canonical machine-readable format',
    preview: '{ "reflections": [...], "metadata": {...} }'
  },
  markdown: {
    icon: FileText,
    label: 'Markdown',
    description: 'Human-readable text format',
    preview: '# Reflections\n\n## 2024-01-15\n\nMy thoughts...'
  },
  pdf: {
    icon: FileText,
    label: 'PDF',
    description: 'Portable document format',
    preview: 'Formatted document with metadata'
  },
  zip: {
    icon: Package,
    label: 'ZIP Bundle',
    description: 'Complete archive with all assets',
    preview: 'reflections/ + metadata/ + receipts/'
  }
};

const encryptionConfig: Record<EncryptionStrength, { label: string; description: string; color: string }> = {
  none: {
    label: 'No Encryption',
    description: 'Unencrypted export',
    color: 'var(--color-text-muted)'
  },
  standard: {
    label: 'Standard Encryption',
    description: 'AES-256 encryption',
    color: 'var(--color-success)'
  },
  strong: {
    label: 'Strong Encryption',
    description: 'AES-256 + key derivation',
    color: 'var(--color-accent-gold)'
  }
};

export function DownloadExportInstrument({
  scope,
  scopeDescription,
  itemCount,
  estimatedSize,
  onExport,
  licenseText,
  licenseImplications,
  onClose
}: DownloadExportInstrumentProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [encryptionStrength, setEncryptionStrength] = useState<EncryptionStrength>('none');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<{
    checksum: string;
    size: string;
    timestamp: string;
    filename: string;
  } | null>(null);
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLicenseDetails, setShowLicenseDetails] = useState(false);
  const [understoodImplications, setUnderstoodImplications] = useState(false);

  const currentFormat = formatConfig[selectedFormat];
  const FormatIcon = currentFormat.icon;
  const currentEncryption = encryptionConfig[encryptionStrength];

  const needsPassword = encryptionStrength !== 'none';
  const canExport = !needsPassword || (needsPassword && encryptionPassword.length >= 8);

  const handleExport = async () => {
    if (!canExport) return;

    setIsExporting(true);
    setExportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await onExport(selectedFormat, encryptionStrength);
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        setExportResult(result);
        setIsExporting(false);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const copyChecksum = () => {
    if (exportResult) {
      navigator.clipboard.writeText(exportResult.checksum);
      setCopiedChecksum(true);
      setTimeout(() => setCopiedChecksum(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Export data"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-[var(--color-surface-emphasis)]">
                <Download size={20} className="text-[var(--color-accent-gold)]" />
              </div>
              <div>
                <h2 className="text-[var(--color-text-primary)] mb-1">Export Data</h2>
                <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                  {scope.replace('-', ' ')}: {scopeDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Scope Summary */}
          <div className="grid grid-cols-3 gap-3">
            {itemCount !== undefined && (
              <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
                <div className="text-xs text-[var(--color-text-muted)] mb-1">Items</div>
                <div className="text-lg font-bold text-[var(--color-text-primary)]">{itemCount}</div>
              </div>
            )}
            {estimatedSize && (
              <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
                <div className="text-xs text-[var(--color-text-muted)] mb-1">Est. Size</div>
                <div className="text-lg font-bold text-[var(--color-text-primary)]">{estimatedSize}</div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Format</div>
              <div className="text-sm font-medium text-[var(--color-text-primary)] uppercase">{selectedFormat}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Not Started */}
          {!isExporting && !exportResult && (
            <>
              {/* Format Selection */}
              <div>
                <div className="text-sm text-[var(--color-text-primary)] mb-3">Choose Format</div>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(formatConfig) as [ExportFormat, typeof formatConfig[ExportFormat]][]).map(([format, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedFormat === format;

                    return (
                      <button
                        key={format}
                        onClick={() => {
                          setSelectedFormat(format);
                          setShowPreview(false);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <Icon size={20} className={isSelected ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)]'} />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                              {config.label}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)]">
                              {config.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Format Preview */}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="mt-3 text-xs text-[var(--color-accent-gold)] hover:underline flex items-center gap-1"
                >
                  <Eye size={12} />
                  <span>{showPreview ? 'Hide' : 'Show'} preview</span>
                </button>

                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)]">
                        <div className="text-xs text-[var(--color-text-muted)] mb-2">Format preview</div>
                        <code className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap">
                          {currentFormat.preview}
                        </code>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Encryption Options */}
              <div>
                <div className="text-sm text-[var(--color-text-primary)] mb-3">Encryption</div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(encryptionConfig) as [EncryptionStrength, typeof encryptionConfig[EncryptionStrength]][]).map(([strength, config]) => {
                    const isSelected = encryptionStrength === strength;

                    return (
                      <button
                        key={strength}
                        onClick={() => setEncryptionStrength(strength)}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-2">
                          {strength === 'none' ? (
                            <Unlock size={16} style={{ color: config.color }} />
                          ) : (
                            <Lock size={16} style={{ color: config.color }} />
                          )}
                        </div>
                        <div className="text-xs font-medium text-[var(--color-text-primary)] mb-1 text-center">
                          {config.label}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] text-center">
                          {config.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Password Input */}
                {needsPassword && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3"
                  >
                    <label className="block mb-2">
                      <div className="text-xs text-[var(--color-text-muted)] mb-1">Encryption Password</div>
                      <input
                        type="password"
                        value={encryptionPassword}
                        onChange={(e) => setEncryptionPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-gold)]"
                      />
                    </label>
                    {encryptionPassword.length > 0 && encryptionPassword.length < 8 && (
                      <p className="text-xs text-[var(--color-warning)] mt-1">
                        Password must be at least 8 characters
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* License Implications */}
              <div className="p-4 rounded-2xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
                <button
                  onClick={() => setShowLicenseDetails(!showLicenseDetails)}
                  className="w-full flex items-start gap-2 mb-2"
                >
                  <AlertCircle size={16} className="text-[var(--color-warning)] mt-0.5" />
                  <div className="flex-1 text-left">
                    <div className="text-sm text-[var(--color-text-primary)] mb-1">
                      License & Implications
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {licenseImplications}
                    </p>
                  </div>
                </button>

                <AnimatePresence>
                  {showLicenseDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="p-3 rounded-xl bg-[var(--color-surface-card)] max-h-32 overflow-y-auto">
                        <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">
                          {licenseText}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="flex items-start gap-3 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understoodImplications}
                    onChange={(e) => setUnderstoodImplications(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    I understand the license implications of this export
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Exporting State */}
          {isExporting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 rounded-2xl bg-[var(--color-surface-emphasis)] flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Download size={32} className="text-[var(--color-accent-gold)]" />
              </motion.div>
              <div className="text-center">
                <div className="text-sm text-[var(--color-text-primary)] mb-2">
                  Preparing export...
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {Math.round(exportProgress)}%
                </div>
              </div>
              <div className="w-full h-2 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--color-accent-gold)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${exportProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Export Complete */}
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="p-6 rounded-2xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-center">
                <CheckCircle size={48} className="text-[var(--color-success)] mx-auto mb-3" />
                <div className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                  Export Complete
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {exportResult.filename}
                </p>
              </div>

              {/* Export Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">File Size</div>
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{exportResult.size}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">Timestamp</div>
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">
                    {new Date(exportResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Checksum */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[var(--color-text-muted)]">Integrity Checksum</div>
                  <button
                    onClick={copyChecksum}
                    className="text-xs text-[var(--color-accent-gold)] hover:underline flex items-center gap-1"
                  >
                    {copiedChecksum ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedChecksum ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-[var(--color-text-secondary)] block overflow-x-auto">
                  {exportResult.checksum}
                </code>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Use this checksum to verify file integrity
                </p>
              </div>

              {/* Receipt Included */}
              <div className="p-4 rounded-2xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-[var(--color-text-primary)] mb-1">
                      Receipt Included
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      This export includes a machine-verifiable receipt with provenance data
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          {!exportResult ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={!canExport || !understoodImplications || isExporting}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-sm font-medium transition-colors"
            >
              Done
            </button>
          )}
          <p className="text-xs text-center text-[var(--color-text-muted)] mt-3">
            All formats have equal integrity. Choose what serves you.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
