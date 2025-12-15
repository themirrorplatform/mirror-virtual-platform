/**
 * Migration Instrument
 * Migrate data between systems/versions
 * Constitutional: data portability guarantee
 */

import { motion } from 'framer-motion';
import { Download, Upload, Package, AlertCircle, CheckCircle, Loader2, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

interface MigrationJob {
  id: string;
  type: 'import' | 'export';
  source: string;
  destination: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  itemsTotal: number;
  itemsProcessed: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

interface MigrationInstrumentProps {
  jobs: MigrationJob[];
  supportedFormats: { id: string; name: string; description: string }[];
  onStartImport: (file: File, format: string) => void;
  onStartExport: (format: string, options: any) => void;
  onCancelJob: (jobId: string) => void;
  onClose: () => void;
}

export function MigrationInstrument({
  jobs,
  supportedFormats,
  onStartImport,
  onStartExport,
  onCancelJob,
  onClose,
}: MigrationInstrumentProps) {
  const [mode, setMode] = useState<'overview' | 'import' | 'export'>('overview');
  const [selectedFormat, setSelectedFormat] = useState('');

  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending');
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'failed');

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
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Package size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Data Migration</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Import from or export to other systems</p>
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
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>Constitutional:</strong> Your data is portable. Import from other platforms or export to leave Mirror anytime.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('import')}
                  className="p-6 rounded-xl border-2 border-[var(--color-border-subtle)] hover:border-blue-400 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-all">
                    <Upload size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Import Data</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Bring your data from other platforms</p>
                </button>
                <button
                  onClick={() => setMode('export')}
                  className="p-6 rounded-xl border-2 border-[var(--color-border-subtle)] hover:border-green-400 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-all">
                    <Download size={24} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Export Data</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Take your data to another platform</p>
                </button>
              </div>

              {activeJobs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Active Migrations</h3>
                  <div className="space-y-3">
                    {activeJobs.map((job) => (
                      <JobCard key={job.id} job={job} onCancel={onCancelJob} />
                    ))}
                  </div>
                </div>
              )}

              {completedJobs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Recent Migrations</h3>
                  <div className="space-y-2">
                    {completedJobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className={`p-4 rounded-xl border ${
                          job.status === 'completed'
                            ? 'border-green-400/30 bg-green-500/5'
                            : 'border-red-400/30 bg-red-500/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {job.status === 'completed' ? (
                                <CheckCircle size={18} className="text-green-400" />
                              ) : (
                                <AlertCircle size={18} className="text-red-400" />
                              )}
                              <span className={`font-semibold ${job.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                                {job.status === 'completed' ? 'Completed' : 'Failed'}
                              </span>
                            </div>
                            <div className="text-sm text-[var(--color-text-primary)]">
                              {job.source} → {job.destination}
                            </div>
                            {job.error && (
                              <div className="text-xs text-red-400 mt-1">{job.error}</div>
                            )}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {job.completedAt?.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)]">
                <h4 className="text-sm font-semibold mb-3 text-[var(--color-text-primary)]">Supported Formats</h4>
                <div className="grid grid-cols-2 gap-3">
                  {supportedFormats.map((format) => (
                    <div key={format.id} className="p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                      <div className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{format.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{format.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'import' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Select a format and upload your data file. We'll guide you through the import process.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-[var(--color-text-primary)]">Import Format</label>
                <div className="space-y-2">
                  {supportedFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedFormat === format.id
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <div className="font-semibold text-[var(--color-text-primary)] mb-1">{format.name}</div>
                      <div className="text-sm text-[var(--color-text-muted)]">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              {selectedFormat && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Upload File</label>
                  <label className="block w-full p-8 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-blue-400 transition-all cursor-pointer text-center">
                    <Upload size={32} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                    <div className="text-sm text-[var(--color-text-primary)] mb-1">Click to upload or drag and drop</div>
                    <div className="text-xs text-[var(--color-text-muted)]">Supported format: {supportedFormats.find(f => f.id === selectedFormat)?.name}</div>
                    <input type="file" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                      if (e.target.files?.[0]) {
                        onStartImport(e.target.files[0], selectedFormat);
                        setMode('overview');
                        setSelectedFormat('');
                      }
                    }} />
                  </label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setMode('overview');
                    setSelectedFormat('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Select a format to export your data. You'll receive a complete archive of your Mirror data.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-[var(--color-text-primary)]">Export Format</label>
                <div className="space-y-2">
                  {supportedFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedFormat === format.id
                          ? 'border-green-400 bg-green-500/10'
                          : 'border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <div className="font-semibold text-[var(--color-text-primary)] mb-1">{format.name}</div>
                      <div className="text-sm text-[var(--color-text-muted)]">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setMode('overview');
                    setSelectedFormat('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedFormat) {
                      onStartExport(selectedFormat, {});
                      setMode('overview');
                      setSelectedFormat('');
                    }
                  }}
                  disabled={!selectedFormat}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50"
                >
                  Start Export
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

function JobCard({ job, onCancel }: { job: MigrationJob; onCancel: (id: string) => void }) {
  return (
    <div className="p-6 rounded-xl border-2 border-blue-400 bg-blue-500/5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {job.type === 'import' ? (
              <Upload size={20} className="text-blue-400" />
            ) : (
              <Download size={20} className="text-green-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{job.source}</span>
                <ArrowRight size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{job.destination}</span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {job.itemsProcessed} / {job.itemsTotal} items
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => onCancel(job.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400"
        >
          <X size={18} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">{job.status === 'running' ? 'Processing...' : 'Pending...'}</span>
          <span className="text-[var(--color-text-primary)]">{Math.round(job.progress * 100)}%</span>
        </div>
        <div className="h-2 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all"
            style={{ width: `${job.progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}


