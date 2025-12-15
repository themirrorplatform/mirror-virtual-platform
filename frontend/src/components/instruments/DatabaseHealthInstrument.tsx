/**
 * Database Health Instrument
 * Monitor local database status
 * Constitutional: transparency about system state
 */

import { motion } from 'framer-motion';
import { Database, Activity, HardDrive, Zap, AlertTriangle, CheckCircle, RefreshCw, Trash2, X } from 'lucide-react';

interface DatabaseMetrics {
  storageUsed: number;
  storageTotal: number;
  reflectionCount: number;
  lastSync?: Date;
  lastBackup?: Date;
  integrityStatus: 'healthy' | 'warning' | 'error';
  issues: { severity: 'info' | 'warning' | 'error'; message: string }[];
}

interface DatabaseHealthInstrumentProps {
  metrics: DatabaseMetrics;
  onRunIntegrityCheck: () => void;
  onOptimize: () => void;
  onClearCache: () => void;
  onBackup: () => void;
  onClose: () => void;
}

export function DatabaseHealthInstrument({
  metrics,
  onRunIntegrityCheck,
  onOptimize,
  onClearCache,
  onBackup,
  onClose,
}: DatabaseHealthInstrumentProps) {
  const storagePercentage = (metrics.storageUsed / metrics.storageTotal) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const StatusIcon = getStatusIcon(metrics.integrityStatus);
  const statusColor = getStatusColor(metrics.integrityStatus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${statusColor}-500/10 flex items-center justify-center`}>
                <Database size={24} className={`text-${statusColor}-400`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Database Health</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Monitor local database status</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className={`p-4 rounded-xl border border-${statusColor}-400/30 bg-${statusColor}-500/5`}>
            <div className="flex items-start gap-3">
              <StatusIcon size={24} className={`text-${statusColor}-400 flex-shrink-0`} />
              <div className="flex-1">
                <div className={`text-lg font-semibold text-${statusColor}-400 mb-1 capitalize`}>
                  {metrics.integrityStatus}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {metrics.integrityStatus === 'healthy' && 'Your database is functioning normally'}
                  {metrics.integrityStatus === 'warning' && 'Minor issues detected—consider maintenance'}
                  {metrics.integrityStatus === 'error' && 'Critical issues detected—immediate action recommended'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <HardDrive size={20} className="text-blue-400" />
                </div>
                <div className="text-sm font-medium text-[var(--color-text-muted)]">Storage</div>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                {formatBytes(metrics.storageUsed)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mb-2">
                of {formatBytes(metrics.storageTotal)} used
              </div>
              <div className="h-2 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    storagePercentage > 90 ? 'bg-red-400' : storagePercentage > 70 ? 'bg-orange-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Activity size={20} className="text-purple-400" />
                </div>
                <div className="text-sm font-medium text-[var(--color-text-muted)]">Reflections</div>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                {metrics.reflectionCount.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Total stored
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <RefreshCw size={20} className="text-green-400" />
                </div>
                <div className="text-sm font-medium text-[var(--color-text-muted)]">Last Sync</div>
              </div>
              <div className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                {metrics.lastSync ? formatRelativeTime(metrics.lastSync) : 'Never'}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {metrics.lastSync ? metrics.lastSync.toLocaleString() : 'No sync yet'}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Database size={20} className="text-orange-400" />
                </div>
                <div className="text-sm font-medium text-[var(--color-text-muted)]">Last Backup</div>
              </div>
              <div className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                {metrics.lastBackup ? formatRelativeTime(metrics.lastBackup) : 'Never'}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {metrics.lastBackup ? metrics.lastBackup.toLocaleString() : 'No backup yet'}
              </div>
            </div>
          </div>

          {metrics.issues.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">Issues ({metrics.issues.length})</h3>
              <div className="space-y-2">
                {metrics.issues.map((issue, i) => {
                  const color = issue.severity === 'error' ? 'red' : issue.severity === 'warning' ? 'orange' : 'blue';
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border border-${color}-400/30 bg-${color}-500/5`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={18} className={`text-${color}-400 mt-0.5 flex-shrink-0`} />
                        <div>
                          <div className={`text-xs font-medium text-${color}-400 mb-1 uppercase`}>
                            {issue.severity}
                          </div>
                          <div className="text-sm text-[var(--color-text-secondary)]">{issue.message}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">Maintenance</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onRunIntegrityCheck}
                className="p-4 rounded-xl border border-[var(--color-border-subtle)] hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-[var(--color-accent-gold)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">Integrity Check</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Verify database consistency</p>
              </button>
              <button
                onClick={onOptimize}
                className="p-4 rounded-xl border border-[var(--color-border-subtle)] hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Zap size={20} className="text-[var(--color-accent-gold)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">Optimize</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Improve performance</p>
              </button>
              <button
                onClick={onClearCache}
                className="p-4 rounded-xl border border-[var(--color-border-subtle)] hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Trash2 size={20} className="text-[var(--color-accent-gold)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">Clear Cache</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Free up space</p>
              </button>
              <button
                onClick={onBackup}
                className="p-4 rounded-xl border border-[var(--color-border-subtle)] hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Database size={20} className="text-[var(--color-accent-gold)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">Backup Now</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Create snapshot</p>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Constitutional:</strong> You control your local database. All data stays on your device unless you choose to sync.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

