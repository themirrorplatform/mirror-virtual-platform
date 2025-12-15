/**
 * Device Registry Panel
 * 
 * Constitutional Principles:
 * - User sees where data lives
 * - Transparent sync status
 * - User controls device list
 * - Multi-device awareness
 */

import { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { deviceRegistry, RegisteredDevice } from '../../services/deviceRegistry';
import { useAppState } from '../../hooks/useAppState';
import { Button } from '../Button';
import { Card } from '../Card';
import { Modal } from '../Modal';
import { Input } from '../Input';

export function DeviceRegistryPanel() {
  const { reflections, threads, identityAxes } = useAppState();
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<RegisteredDevice | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadDevices();
    updateDataCounts();
  }, [reflections, threads, identityAxes]);

  const loadDevices = () => {
    setDevices(deviceRegistry.getDevices());
  };

  const updateDataCounts = () => {
    deviceRegistry.updateDataCounts({
      reflections: reflections.length,
      threads: threads.length,
      axes: identityAxes.length,
    });
    loadDevices();
  };

  const handleRename = (device: RegisteredDevice) => {
    setSelectedDevice(device);
    setNewName(device.name);
    setShowRenameModal(true);
  };

  const handleSaveRename = () => {
    if (selectedDevice && newName.trim()) {
      deviceRegistry.renameDevice(selectedDevice.id, newName.trim());
      loadDevices();
      setShowRenameModal(false);
      setSelectedDevice(null);
      setNewName('');
    }
  };

  const handleRemove = (device: RegisteredDevice) => {
    if (device.isCurrentDevice) {
      alert('Cannot remove current device');
      return;
    }

    if (confirm(`Remove ${device.name} from registry?`)) {
      deviceRegistry.removeDevice(device.id);
      loadDevices();
    }
  };

  const handleClearOthers = () => {
    if (confirm('Remove all other devices from registry? This only removes the registry entries, not the actual data on those devices.')) {
      deviceRegistry.clearOtherDevices();
      loadDevices();
    }
  };

  const getDeviceIcon = (type: RegisteredDevice['type']) => {
    switch (type) {
      case 'mobile': return <Smartphone size={20} />;
      case 'tablet': return <Tablet size={20} />;
      default: return <Monitor size={20} />;
    }
  };

  const syncStatus = deviceRegistry.getSyncStatus();
  const currentDevice = deviceRegistry.getCurrentDevice();

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3>Multi-Device Status</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDevices}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Devices Registered</p>
            <p className="text-2xl">{syncStatus.totalDevices}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Sync Status</p>
            <p className={`text-sm font-medium ${
              syncStatus.inSync 
                ? 'text-[var(--color-accent-green)]' 
                : 'text-[var(--color-accent-amber)]'
            }`}>
              {syncStatus.inSync ? 'In Sync' : 'Out of Sync'}
            </p>
          </div>
        </div>

        {syncStatus.lastSync && (
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            Last sync: {syncStatus.lastSync.toLocaleString()}
          </p>
        )}
      </Card>

      {/* Current Device */}
      {currentDevice && (
        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <div className="text-[var(--color-accent-blue)] mt-0.5">
              {getDeviceIcon(currentDevice.type)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{currentDevice.name}</p>
                <span className="text-xs bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] px-2 py-0.5 rounded">
                  Current Device
                </span>
              </div>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                {currentDevice.browser} on {currentDevice.os}
              </p>

              <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Reflections</p>
                  <p className="text-lg">{currentDevice.dataCount.reflections}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Threads</p>
                  <p className="text-lg">{currentDevice.dataCount.threads}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Axes</p>
                  <p className="text-lg">{currentDevice.dataCount.axes}</p>
                </div>
              </div>

              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRename(currentDevice)}
                >
                  <Edit2 size={14} />
                  Rename Device
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Other Devices */}
      {devices.filter(d => !d.isCurrentDevice).length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h4>Other Devices ({devices.filter(d => !d.isCurrentDevice).length})</h4>
            {devices.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearOthers}
              >
                <Trash2 size={14} />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {devices.filter(d => !d.isCurrentDevice).map(device => (
              <div key={device.id} className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-[var(--color-text-muted)] mt-0.5">
                    {getDeviceIcon(device.type)}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium mb-1">{device.name}</p>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                      {device.browser} on {device.os}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mb-2">
                      <span>First: {device.firstSeen.toLocaleDateString()}</span>
                      <span>Last: {device.lastSeen.toLocaleDateString()}</span>
                    </div>

                    {device.lastSync && (
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">
                        Last sync: {device.lastSync.toLocaleString()}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRename(device)}
                      >
                        <Edit2 size={14} />
                        Rename
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(device)}
                      >
                        <Trash2 size={14} />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Explanation */}
      <Card variant="emphasis">
        <h4 className="mb-2">About Device Registry</h4>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li>• The Mirror tracks which devices you've used</li>
          <li>• This helps you understand where your data lives</li>
          <li>• Removing a device only removes it from this list</li>
          <li>• Data on other devices remains unaffected</li>
          <li>• All data is stored locally on each device</li>
        </ul>
      </Card>

      {/* Rename Modal */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setSelectedDevice(null);
          setNewName('');
        }}
        title="Rename Device"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Choose a name that helps you identify this device.
          </p>

          <Input
            label="Device Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., MacBook Pro, iPhone 15"
          />

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleSaveRename}
              disabled={!newName.trim()}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowRenameModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
