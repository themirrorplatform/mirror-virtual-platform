import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Monitor,
  Tablet,
  HardDrive,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  Wifi,
  WifiOff,
} from 'lucide-react';

type DevicePlatform = 'desktop' | 'mobile' | 'tablet';
type DeviceStatus = 'active' | 'offline' | 'revoked';
type TrustLevel = 'trusted' | 'this-device' | 'suspicious';

interface Device {
  id: string;
  name: string;
  platform: DevicePlatform;
  lastSeen: string;
  status: DeviceStatus;
  trustLevel: TrustLevel;
  ipAddress: string;
  addedDate: string;
}

export function DevicesScreen() {
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(true);

  const devices: Device[] = [
    {
      id: '1',
      name: 'MacBook Pro',
      platform: 'desktop',
      lastSeen: 'Active now',
      status: 'active',
      trustLevel: 'this-device',
      ipAddress: '192.168.1.42',
      addedDate: '2024-10-15',
    },
    {
      id: '2',
      name: 'iPhone 14',
      platform: 'mobile',
      lastSeen: '2 hours ago',
      status: 'active',
      trustLevel: 'trusted',
      ipAddress: '192.168.1.87',
      addedDate: '2024-10-15',
    },
    {
      id: '3',
      name: 'iPad Air',
      platform: 'tablet',
      lastSeen: '3 days ago',
      status: 'offline',
      trustLevel: 'trusted',
      ipAddress: '192.168.1.91',
      addedDate: '2024-10-20',
    },
    {
      id: '4',
      name: 'Work Laptop',
      platform: 'desktop',
      lastSeen: '1 week ago',
      status: 'offline',
      trustLevel: 'trusted',
      ipAddress: '10.0.1.56',
      addedDate: '2024-11-01',
    },
  ];

  const handleRevoke = (deviceId: string) => {
    console.log('Revoking device:', deviceId);
    setShowRevokeConfirm(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-blue)]/20">
            <HardDrive size={32} className="text-[var(--color-accent-blue)]" />
          </div>
          <div>
            <h1 className="mb-1">Devices & Sessions</h1>
            <p className="text-[var(--color-text-secondary)]">
              Manage where your Mirror is accessible and how data syncs
            </p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <HardDrive size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                Your Mirror can sync across your devices while maintaining sovereignty. All sync happens 
                encrypted, peer-to-peer when possible, and you control which devices have access.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Revoke a device and it loses access immediately—even to cached data.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Global Sync Controls */}
      <Card className="mb-6">
        <h3 className="mb-4">Sync Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm mb-1">Sync Enabled</h5>
              <p className="text-xs text-[var(--color-text-muted)]">
                Keep your reflections in sync across all trusted devices
              </p>
            </div>
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                syncEnabled ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-border-strong)]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  syncEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {syncEnabled && (
            <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-3">
              <InfoRow
                label="Sync Status"
                value="All mirrors in sync"
                valueColor="text-[var(--color-accent-green)]"
              />
              <InfoRow label="Last Sync" value="2 minutes ago" />
              <InfoRow label="Sync Method" value="Peer-to-peer (local network)" />
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] flex gap-3">
          <Button variant="secondary" size="sm">
            Require Sign-In on All Devices
          </Button>
          <Button variant="secondary" size="sm">
            Pause Syncing for 24h
          </Button>
        </div>
      </Card>

      {/* Devices List */}
      <div className="mb-6">
        <h3 className="mb-4">Your Devices</h3>
        <div className="space-y-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onRevoke={() => setShowRevokeConfirm(device.id)}
            />
          ))}
        </div>
      </div>

      {/* Add Device */}
      <Card>
        <h4 className="mb-3">Add a New Device</h4>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          To add a new device, install The Mirror and sign in with your credentials. 
          The device will appear here automatically and request trust.
        </p>
        <Button variant="secondary">
          Generate One-Time Pairing Code
        </Button>
      </Card>

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 bg-[var(--color-overlay-scrim)] z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowRevokeConfirm(null)}
          />
          <div className="relative w-full max-w-md bg-[var(--color-base-raised)] rounded-xl border border-[var(--color-border-strong)] p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--color-accent-red)]/20">
                <AlertTriangle size={20} className="text-[var(--color-accent-red)]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">Revoke Device Access?</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  This device will immediately lose access to your Mirror, including cached reflections.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] mb-6">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Device: <strong>{devices.find(d => d.id === showRevokeConfirm)?.name}</strong>
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Last seen: {devices.find(d => d.id === showRevokeConfirm)?.lastSeen}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowRevokeConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleRevoke(showRevokeConfirm)}>
                Revoke Access
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceCard({ device, onRevoke }: { device: Device; onRevoke: () => void }) {
  const PlatformIcon = 
    device.platform === 'desktop' ? Monitor :
    device.platform === 'mobile' ? Smartphone :
    Tablet;

  return (
    <Card className="hover:border-[var(--color-accent-gold)] transition-colors">
      <div className="flex items-start gap-4">
        {/* Platform Icon */}
        <div className="p-3 rounded-lg bg-[var(--color-base-raised)]">
          <PlatformIcon size={24} className="text-[var(--color-accent-blue)]" />
        </div>

        {/* Device Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4>{device.name}</h4>
            {device.trustLevel === 'this-device' && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                This Device
              </span>
            )}
            {device.status === 'active' && device.trustLevel !== 'this-device' && (
              <CheckCircle2 size={16} className="text-[var(--color-accent-green)]" />
            )}
            {device.status === 'offline' && (
              <WifiOff size={16} className="text-[var(--color-text-muted)]" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
            <InfoRow label="Status" value={device.lastSeen} />
            <InfoRow label="Added" value={device.addedDate} />
            <InfoRow label="IP Address" value={device.ipAddress} />
            <InfoRow 
              label="Trust Level" 
              value={
                device.trustLevel === 'this-device' ? 'Current' :
                device.trustLevel === 'trusted' ? 'Trusted' :
                'Suspicious'
              }
              valueColor={
                device.trustLevel === 'suspicious' 
                  ? 'text-[var(--color-accent-red)]' 
                  : 'text-[var(--color-accent-green)]'
              }
            />
          </div>

          {device.trustLevel !== 'this-device' && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                Rename
              </Button>
              <Button variant="ghost" size="sm" onClick={onRevoke}>
                Revoke Access
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ 
  label, 
  value, 
  valueColor = 'text-[var(--color-text-primary)]' 
}: { 
  label: string; 
  value: string; 
  valueColor?: string 
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[var(--color-text-muted)]">{label}:</span>
      <span className={`${valueColor}`}>{value}</span>
    </div>
  );
}


