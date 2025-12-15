/**
 * Offline Sync Panel
 * 
 * Constitutional Principles:
 * - User sees queued changes clearly
 * - User controls sync timing
 * - Auto-sync is opt-in
 * - Queue status transparent
 */

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Trash2, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { offlineQueue, QueuedAction } from '../services/offlineQueue';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';

export function OfflineSyncPanel() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [status, setStatus] = useState(offlineQueue.getStatus());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(offlineQueue.isAutoSyncEnabled());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadQueue();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      loadQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      loadQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh queue every 5 seconds
    const interval = setInterval(loadQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadQueue = () => {
    setQueue(offlineQueue.getQueue());
    setStatus(offlineQueue.getStatus());
    setAutoSyncEnabled(offlineQueue.isAutoSyncEnabled());
  };

  const handleSync = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await offlineQueue.processQueue();
      
      if (result.processed > 0) {
        alert(`Synced ${result.processed} changes successfully`);
      }
      
      if (result.failed > 0) {
        alert(`${result.failed} changes failed to sync:\n${result.errors.join('\n')}`);
      }
      
      loadQueue();
    } catch (error) {
      alert('Sync failed: ' + error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = () => {
    if (confirm('Clear all queued changes? This cannot be undone. Unsynced changes will be lost.')) {
      offlineQueue.clear();
      loadQueue();
    }
  };

  const handleToggleAutoSync = () => {
    if (autoSyncEnabled) {
      offlineQueue.disableAutoSync();
      setAutoSyncEnabled(false);
    } else {
      offlineQueue.enableAutoSync();
      setAutoSyncEnabled(true);
    }
  };

  const getActionTypeLabel = (type: QueuedAction['type']): string => {
    switch (type) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
    }
  };

  const getEntityLabel = (entity: QueuedAction['entity']): string => {
    switch (entity) {
      case 'reflection': return 'Reflection';
      case 'thread': return 'Thread';
      case 'identity_axis': return 'Identity Axis';
    }
  };

  const summary = offlineQueue.getSummary();

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3>Sync Status</h3>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-2 text-[var(--color-accent-green)]">
                <Cloud size={20} />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[var(--color-accent-amber)]">
                <CloudOff size={20} />
                <span className="text-sm">Offline</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Queued</p>
            <p className="text-2xl">{status.queueLength}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Auto-Sync</p>
            <p className={`text-sm font-medium ${
              autoSyncEnabled 
                ? 'text-[var(--color-accent-green)]' 
                : 'text-[var(--color-text-muted)]'
            }`}>
              {autoSyncEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Errors</p>
            <p className={`text-2xl ${
              status.hasErrors 
                ? 'text-[var(--color-accent-red)]' 
                : 'text-[var(--color-text-muted)]'
            }`}>
              {queue.filter(q => q.retries > 0).length}
            </p>
          </div>
        </div>

        {status.oldestItem && (
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            Oldest queued: {status.oldestItem.toLocaleString()}
          </p>
        )}
      </Card>

      {/* Queue Summary */}
      {status.queueLength > 0 && (
        <Card variant="emphasis">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {summary}
          </p>
        </Card>
      )}

      {/* Actions */}
      {status.queueLength > 0 && (
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>

          <Button
            variant="ghost"
            onClick={handleClearQueue}
          >
            <Trash2 size={16} />
            Clear Queue
          </Button>
        </div>
      )}

      {/* Queue Items */}
      {queue.length > 0 && (
        <Card>
          <h4 className="mb-3">Queued Changes ({queue.length})</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-lg ${
                  item.retries > 0
                    ? 'bg-[var(--color-accent-red)]/10'
                    : 'bg-[var(--color-bg-secondary)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {getActionTypeLabel(item.type)} {getEntityLabel(item.entity)}
                      </span>
                      {item.retries > 0 && (
                        <span className="text-xs text-[var(--color-accent-red)]">
                          {item.retries} retries
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {item.timestamp.toLocaleString()}
                    </p>
                    {item.lastError && (
                      <p className="text-xs text-[var(--color-accent-red)] mt-1">
                        Error: {item.lastError}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {item.retries === 0 ? (
                      <CheckCircle size={16} className="text-[var(--color-accent-green)]" />
                    ) : (
                      <AlertTriangle size={16} className="text-[var(--color-accent-red)]" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {queue.length === 0 && (
        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-[var(--color-accent-green)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="mb-1">All Synced</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                No pending changes. All data is up to date.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Explanation */}
      <Card variant="emphasis">
        <h4 className="mb-2">About Offline Sync</h4>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li>• Changes made while offline are queued automatically</li>
          <li>• When you go back online, changes can be synced</li>
          <li>• Auto-sync syncs automatically when connection returns</li>
          <li>• Manual sync lets you control when sync happens</li>
          <li>• Failed changes retry automatically (up to 5 times)</li>
        </ul>
      </Card>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Sync Settings"
      >
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="mb-1">Auto-Sync</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Automatically sync when connection returns
                </p>
              </div>
              <button
                onClick={handleToggleAutoSync}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSyncEnabled
                    ? 'bg-[var(--color-accent-green)]'
                    : 'bg-[var(--color-border-subtle)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </Card>

          <Card variant="emphasis">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Recommendation:</strong> Keep auto-sync enabled for seamless experience 
              across devices. You can always manually sync when needed.
            </p>
          </Card>

          <Button
            variant="default"
            onClick={() => setShowSettings(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
