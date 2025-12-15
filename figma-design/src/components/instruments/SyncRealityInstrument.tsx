import { motion } from 'motion/react';
import { Cloud, CloudOff, Smartphone, Laptop, CheckCircle, AlertTriangle } from 'lucide-react';
import { Layer } from './LayerHUD';

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastSeen: string;
  isCurrentDevice: boolean;
}

interface SyncRealityInstrumentProps {
  devices: Device[];
  networkStatus: 'online' | 'offline' | 'syncing';
  pendingChanges: number;
  conflictCount: number;
  layer: Layer;
  syncBoundaries: {
    sovereign: boolean;
    commons: boolean;
    builder: boolean;
  };
  onToggleSyncBoundary: (layer: Layer) => void;
  onResolveConflicts?: () => void;
  onExportDeviceReceipt?: () => void;
  onClose: () => void;
}

export function SyncRealityInstrument({
  devices,
  networkStatus,
  pendingChanges,
  conflictCount,
  layer,
  syncBoundaries,
  onToggleSyncBoundary,
  onResolveConflicts,
  onExportDeviceReceipt,
  onClose
}: SyncRealityInstrumentProps) {
  const DeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'desktop': return Laptop;
      case 'tablet': return Smartphone;
      default: return Smartphone;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl shadow-ambient-xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-emphasis)]/20 to-transparent">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)] shadow-ambient-sm">
              {networkStatus === 'offline' ? (
                <CloudOff size={24} className="text-[var(--color-error)]" />
              ) : (
                <Cloud size={24} className="text-[var(--color-accent-gold)]" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-[var(--color-text-primary)] mb-2 text-xl font-semibold tracking-tight">Sync Reality</h2>
              <p className="text-base text-[var(--color-text-secondary)] leading-[1.6]">
                Multi-device state and boundaries
              </p>
            </div>
          </div>

          {/* Network Status */}
          <div className={`p-6 rounded-2xl border shadow-ambient-sm ${
            networkStatus === 'offline' 
              ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30'
              : networkStatus === 'syncing'
              ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
              : 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {networkStatus === 'offline' && <CloudOff size={20} className="text-[var(--color-error)]" />}
              {networkStatus === 'online' && <CheckCircle size={20} className="text-[var(--color-success)]" />}
              {networkStatus === 'syncing' && <Cloud size={20} className="text-[var(--color-warning)]" />}
              <span className={`text-base capitalize font-medium ${
                networkStatus === 'offline' ? 'text-[var(--color-error)]' :
                networkStatus === 'syncing' ? 'text-[var(--color-warning)]' :
                'text-[var(--color-success)]'
              }`}>
                {networkStatus}
              </span>
            </div>
            {pendingChanges > 0 && (
              <div className="text-sm text-[var(--color-text-muted)]">
                {pendingChanges} pending {pendingChanges === 1 ? 'change' : 'changes'}
              </div>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Conflict Warning */}
          {conflictCount > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 shadow-ambient-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-[var(--color-warning)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-base text-[var(--color-warning)] mb-2 font-medium">
                    {conflictCount} {conflictCount === 1 ? 'Conflict' : 'Conflicts'} Detected
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-[1.6]">
                    Changes made on different devices conflict with each other
                  </p>
                  {onResolveConflicts && (
                    <button
                      onClick={onResolveConflicts}
                      className="px-5 py-3 rounded-xl bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-black text-base font-medium transition-colors"
                    >
                      Resolve Conflicts
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Devices */}
          <div>
            <div className="text-base text-[var(--color-text-primary)] mb-5">Devices</div>
            <div className="space-y-4">
              {devices.map((device) => {
                const Icon = DeviceIcon(device.type);
                return (
                  <div
                    key={device.id}
                    className={`p-6 rounded-2xl border transition-colors shadow-ambient-sm ${
                      device.isCurrentDevice
                        ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                        : 'border-[var(--color-border-subtle)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Icon size={20} className="text-[var(--color-text-muted)] mt-1" />
                        <div className="flex-1">
                          <div className="text-base text-[var(--color-text-primary)] mb-2">
                            {device.name}
                            {device.isCurrentDevice && (
                              <span className="ml-3 text-sm text-[var(--color-accent-gold)]">(This device)</span>
                            )}
                          </div>
                          <div className="text-sm text-[var(--color-text-muted)]">
                            Last seen: {device.lastSeen}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sync Boundaries */}
          <div>
            <div className="text-base text-[var(--color-text-primary)] mb-5">Sync Boundaries per Layer</div>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-colors cursor-pointer shadow-ambient-sm">
                <div>
                  <div className="text-base text-[var(--color-text-primary)] mb-2">Sovereign</div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {syncBoundaries.sovereign ? 'Sync allowed' : 'Local-only (no sync)'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={syncBoundaries.sovereign}
                  onChange={() => onToggleSyncBoundary('sovereign')}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-colors cursor-pointer shadow-ambient-sm">
                <div>
                  <div className="text-base text-[var(--color-text-primary)] mb-2">Commons</div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {syncBoundaries.commons ? 'Sync allowed' : 'Local-only (no sync)'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={syncBoundaries.commons}
                  onChange={() => onToggleSyncBoundary('commons')}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-colors cursor-pointer shadow-ambient-sm">
                <div>
                  <div className="text-base text-[var(--color-text-primary)] mb-2">Builder</div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {syncBoundaries.builder ? 'Sync allowed' : 'Local-only (no sync)'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={syncBoundaries.builder}
                  onChange={() => onToggleSyncBoundary('builder')}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-emphasis)]/30">
          <div className="flex items-center gap-4">
            {onExportDeviceReceipt && (
              <button
                onClick={onExportDeviceReceipt}
                className="flex-1 px-6 py-4 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-base transition-colors shadow-ambient-sm"
              >
                Export Device Receipt
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-xl bg-[var(--color-accent-gold)]/10 hover:bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-base transition-colors shadow-ambient-sm"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}