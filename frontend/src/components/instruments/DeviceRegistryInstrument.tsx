/**
 * Device Registry Instrument
 * Manage trusted devices and sessions
 * Constitutional transparency for multi-device access
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Smartphone, Monitor, Trash2, Shield, AlertCircle, X } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'other';
  lastActive: Date;
  trusted: boolean;
  location?: string;
  browser?: string;
}

interface DeviceRegistryInstrumentProps {
  devices: Device[];
  currentDeviceId: string;
  onRevoke: (deviceId: string) => void;
  onRename: (deviceId: string, newName: string) => void;
  onClose: () => void;
}

export function DeviceRegistryInstrument({
  devices,
  currentDeviceId,
  onRevoke,
  onRename,
  onClose,
}: DeviceRegistryInstrumentProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const deviceIcons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Monitor,
    other: Laptop,
  };

  const handleRename = (deviceId: string) => {
    if (editName.trim()) {
      onRename(deviceId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Shield size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Trusted Devices</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Manage devices with access to your Mirror
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Notice */}
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                Each device gets its own encrypted session. Revoking access will sign out that device immediately.
              </div>
            </div>
          </div>

          {/* Device list */}
          <AnimatePresence>
            {devices.map((device) => {
              const DeviceIcon = deviceIcons[device.type];
              const isCurrent = device.id === currentDeviceId;
              const isEditing = editingId === device.id;

              return (
                <div
                  key={device.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                      : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCurrent ? 'bg-[var(--color-accent-gold)]/20' : 'bg-white/5'
                      }`}>
                        <DeviceIcon size={20} className={isCurrent ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)]'} />
                      </div>
                      <div className="flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditName(e.target.value)}
                            onBlur={() => handleRename(device.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(device.id);
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditName('');
                              }
                            }}
                            autoFocus
                            className="w-full px-2 py-1 rounded bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm"
                          />
                        ) : (
                          <div
                            onClick={() => {
                              if (!isCurrent) {
                                setEditingId(device.id);
                                setEditName(device.name);
                              }
                            }}
                            className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent-gold)]"
                          >
                            {device.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs text-[var(--color-accent-gold)]">(This device)</span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-[var(--color-text-muted)] mt-1 space-y-0.5">
                          <div>Last active: {formatLastActive(device.lastActive)}</div>
                          {device.browser && <div>Browser: {device.browser}</div>}
                          {device.location && <div>Location: {device.location}</div>}
                        </div>
                      </div>
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => onRevoke(device.id)}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-all"
                        aria-label="Revoke access"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const EXAMPLE_DEVICES: Device[] = [
  {
    id: 'device-1',
    name: 'MacBook Pro',
    type: 'desktop',
    lastActive: new Date(),
    trusted: true,
    location: 'Seattle, WA',
    browser: 'Chrome 120',
  },
  {
    id: 'device-2',
    name: 'iPhone 15',
    type: 'mobile',
    lastActive: new Date(Date.now() - 3600000 * 5),
    trusted: true,
    location: 'Seattle, WA',
    browser: 'Safari 17',
  },
];


