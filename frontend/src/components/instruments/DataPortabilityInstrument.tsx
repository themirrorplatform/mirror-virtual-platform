/**
 * Data Portability Instrument
 * Enhanced import/export with format conversion
 * Constitutional: right to data portability
 */

import { motion } from 'framer-motion';
import { Download, Upload, FileText, Package, Shield, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon: 'json' | 'markdown' | 'pdf' | 'zip';
}

interface DataPortabilityInstrumentProps {
  exportFormats: ExportFormat[];
  onExport: (format: string, scope: string[], encrypt: boolean) => void;
  onImport: (file: File, format: string) => void;
  onClose: () => void;
}

export function DataPortabilityInstrument({
  exportFormats,
  onExport,
  onImport,
  onClose,
}: DataPortabilityInstrumentProps) {
  const [mode, setMode] = useState<'overview' | 'export' | 'import'>('overview');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedScope, setSelectedScope] = useState<string[]>(['reflections', 'threads', 'identity']);
  const [encrypt, setEncrypt] = useState(false);

  const scopes = [
    { id: 'reflections', label: 'Reflections', description: 'All your reflection content' },
    { id: 'threads', label: 'Threads', description: 'Connection metadata' },
    { id: 'identity', label: 'Identity Graph', description: 'Identity nodes and relationships' },
    { id: 'worldviews', label: 'Worldviews', description: 'Custom perspective filters' },
    { id: 'settings', label: 'Settings', description: 'App preferences' },
  ];

  const handleExport = () => {
    if (selectedFormat && selectedScope.length > 0) {
      onExport(selectedFormat, selectedScope, encrypt);
      setMode('overview');
      setSelectedFormat('');
      setSelectedScope(['reflections', 'threads', 'identity']);
      setEncrypt(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-5xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-gold)]/20 flex items-center justify-center">
                <Package size={24} className="text-[var(--color-accent-gold)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Data Portability</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Your data, your choice—import or export anytime</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mode === 'overview' && (
            <>
              <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-[var(--color-accent-gold)] mt-0.5" />
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    <strong>Constitutional right:</strong> Your data is always portable. Export at any time in multiple formats. No lock-in, ever.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('export')}
                  className="p-8 rounded-xl border-2 border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-all text-center group"
                >
                  <div className="w-16 h-16 rounded-xl bg-[var(--color-accent-gold)]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[var(--color-accent-gold)]/20 transition-all">
                    <Download size={32} className="text-[var(--color-accent-gold)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Export Data</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Download your data in multiple formats</p>
                </button>
                <button
                  onClick={() => setMode('import')}
                  className="p-8 rounded-xl border-2 border-[var(--color-border-subtle)] hover:border-blue-400 transition-all text-center group"
                >
                  <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-all">
                    <Upload size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Import Data</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Bring data from other platforms</p>
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Export Formats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {exportFormats.map((format) => (
                    <div
                      key={format.id}
                      className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
                    >
                      <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">{format.name}</h4>
                      <p className="text-sm text-[var(--color-text-muted)] mb-3">{format.description}</p>
                      <div className="space-y-1">
                        {format.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                            <div className="w-1 h-1 rounded-full bg-[var(--color-accent-gold)]" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Select Format</h3>
                <div className="grid grid-cols-2 gap-3">
                  {exportFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedFormat === format.id
                          ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10'
                          : 'border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">{format.name}</h4>
                      <p className="text-sm text-[var(--color-text-muted)]">{format.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Select Data</h3>
                <div className="space-y-2">
                  {scopes.map((scope) => (
                    <button
                      key={scope.id}
                      onClick={() => {
                        setSelectedScope(prev =>
                          prev.includes(scope.id)
                            ? prev.filter(s => s !== scope.id)
                            : [...prev, scope.id]
                        );
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedScope.includes(scope.id)
                          ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                          : 'border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">{scope.label}</h4>
                          <p className="text-sm text-[var(--color-text-muted)]">{scope.description}</p>
                        </div>
                        {selectedScope.includes(scope.id) && (
                          <CheckCircle size={20} className="text-[var(--color-accent-gold)] flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setEncrypt(!encrypt)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    encrypt
                      ? 'border-green-400 bg-green-500/10'
                      : 'border-[var(--color-border-subtle)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield size={24} className={encrypt ? 'text-green-400' : 'text-[var(--color-text-muted)]'} />
                      <div className="text-left">
                        <div className="font-semibold text-[var(--color-text-primary)]">Encrypt Export</div>
                        <div className="text-sm text-[var(--color-text-muted)]">Password-protect your data</div>
                      </div>
                    </div>
                    {encrypt && <CheckCircle size={20} className="text-green-400" />}
                  </div>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setMode('overview');
                    setSelectedFormat('');
                    setSelectedScope(['reflections', 'threads', 'identity']);
                    setEncrypt(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={!selectedFormat || selectedScope.length === 0}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50 font-medium"
                >
                  Export Data
                </button>
              </div>
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-blue-400 mt-0.5" />
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Import data from other platforms or a previous export. Supported formats: Mirror JSON, generic JSON, Markdown archives.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Upload File</label>
                <label className="block w-full p-12 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-blue-400 transition-all cursor-pointer text-center">
                  <Upload size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
                  <div className="text-lg text-[var(--color-text-primary)] mb-2">Click to upload or drag and drop</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Supported: .json, .zip, .md</div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json,.zip,.md"
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                      if (e.target.files?.[0]) {
                        onImport(e.target.files[0], 'auto-detect');
                        setMode('overview');
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMode('overview')}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            {mode === 'overview' ? 'Close' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  );
}


