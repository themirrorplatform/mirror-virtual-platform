/**
 * Offline Sync - Local-first synchronization
 * 
 * Features:
 * - Offline detection
 * - Local storage management
 * - Sync queue
 * - Conflict resolution UI
 * - Background sync
 * - Data sovereignty controls
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface SyncItem {
  id: string;
  type: 'reflection' | 'thread' | 'post' | 'setting';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
  retries?: number;
}

interface OfflineSyncProps {
  onSync?: (items: SyncItem[]) => Promise<void>;
  onConflict?: (item: SyncItem, serverData: any) => 'local' | 'server' | 'merge';
  autoSync?: boolean;
  syncInterval?: number;
}

export function OfflineSync({
  onSync,
  onConflict,
  autoSync = true,
  syncInterval = 30000, // 30 seconds
}: OfflineSyncProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load sync queue from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mirror-sync-queue');
    if (saved) {
      const items = JSON.parse(saved);
      setSyncQueue(items.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })));
    }
  }, []);

  // Save sync queue to localStorage
  useEffect(() => {
    localStorage.setItem('mirror-sync-queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Auto-sync when online
  useEffect(() => {
    if (!autoSync || !isOnline || syncQueue.length === 0) return;

    const timer = setTimeout(() => {
      handleSync();
    }, syncInterval);

    return () => clearTimeout(timer);
  }, [autoSync, isOnline, syncQueue, syncInterval]);

  const handleSync = async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0) return;

    setIsSyncing(true);

    try {
      // Get pending items
      const pendingItems = syncQueue.filter(
        item => item.status === 'pending' || item.status === 'error'
      );

      if (pendingItems.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Mark as syncing
      setSyncQueue(prev =>
        prev.map(item =>
          pendingItems.some(p => p.id === item.id)
            ? { ...item, status: 'syncing' as const }
            : item
        )
      );

      // Call sync handler
      if (onSync) {
        await onSync(pendingItems);
      }

      // Mark as synced
      setSyncQueue(prev =>
        prev.map(item =>
          pendingItems.some(p => p.id === item.id)
            ? { ...item, status: 'synced' as const }
            : item
        )
      );

      setLastSync(new Date());

      // Clean up old synced items after 1 hour
      setTimeout(() => {
        setSyncQueue(prev =>
          prev.filter(
            item =>
              item.status !== 'synced' ||
              Date.now() - new Date(item.timestamp).getTime() < 3600000
          )
        );
      }, 100);
    } catch (error) {
      console.error('Sync error:', error);

      // Mark as error with retry
      setSyncQueue(prev =>
        prev.map(item =>
          pendingItems.some(p => p.id === item.id)
            ? {
                ...item,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Sync failed',
                retries: (item.retries || 0) + 1,
              }
            : item
        )
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const addToQueue = useCallback((item: Omit<SyncItem, 'id' | 'timestamp' | 'status'>) => {
    const newItem: SyncItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      status: 'pending',
    };

    setSyncQueue(prev => [...prev, newItem]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setSyncQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const retryItem = useCallback((id: string) => {
    setSyncQueue(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'pending' as const, error: undefined } : item
      )
    );
  }, []);

  const pendingCount = syncQueue.filter(item => item.status === 'pending').length;
  const errorCount = syncQueue.filter(item => item.status === 'error').length;

  return (
    <>
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            isOnline
              ? 'bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)]'
              : 'bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]'
          }`}
        >
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="text-xs font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {pendingCount > 0 && (
            <Badge variant="default" className="ml-1">
              {pendingCount}
            </Badge>
          )}
        </button>

        {isOnline && pendingCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            Sync
          </Button>
        )}
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <Card>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Sync Status</h3>
                  {lastSync && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Last sync: {formatTimestamp(lastSync)}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    icon={Clock}
                    label="Pending"
                    value={pendingCount}
                    color="blue"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Synced"
                    value={syncQueue.filter(item => item.status === 'synced').length}
                    color="green"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Errors"
                    value={errorCount}
                    color="yellow"
                  />
                </div>

                {/* Queue Items */}
                {syncQueue.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {syncQueue.map(item => (
                      <SyncItemCard
                        key={item.id}
                        item={item}
                        onRetry={() => retryItem(item.id)}
                        onRemove={() => removeFromQueue(item.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
                    Nothing to sync
                  </div>
                )}

                {/* Actions */}
                {syncQueue.length > 0 && (
                  <div className="flex gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
                    {isOnline && pendingCount > 0 && (
                      <Button onClick={handleSync} disabled={isSyncing}>
                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        Sync Now
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => setSyncQueue([])}
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Stat Card

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow';
}) {
  const colorMap = {
    blue: 'text-[var(--color-accent-blue)]',
    green: 'text-[var(--color-accent-green)]',
    yellow: 'text-[var(--color-accent-yellow)]',
  };

  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <Icon size={16} className={`${colorMap[color]} mb-2`} />
      <div className="text-2xl font-medium mb-1">{value}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

// Sync Item Card

function SyncItemCard({
  item,
  onRetry,
  onRemove,
}: {
  item: SyncItem;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-[var(--color-accent-blue)]', label: 'Pending' },
    syncing: { icon: RefreshCw, color: 'text-[var(--color-accent-blue)]', label: 'Syncing' },
    synced: { icon: CheckCircle, color: 'text-[var(--color-accent-green)]', label: 'Synced' },
    error: { icon: AlertTriangle, color: 'text-[var(--color-accent-yellow)]', label: 'Error' },
  };

  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <Icon
        size={16}
        className={`${config.color} mt-1 ${item.status === 'syncing' ? 'animate-spin' : ''}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {item.action} {item.type}
          </span>
          <Badge variant={item.status === 'error' ? 'error' : 'default'}>
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {formatTimestamp(item.timestamp)}
        </p>
        {item.error && (
          <p className="text-xs text-[var(--color-border-error)] mt-1">
            {item.error}
          </p>
        )}
      </div>
      {item.status === 'error' && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * useOfflineSync Hook - Manage offline sync state
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = useCallback((item: Omit<SyncItem, 'id' | 'timestamp' | 'status'>) => {
    const newItem: SyncItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      status: 'pending',
    };

    setSyncQueue(prev => [...prev, newItem]);

    // Save to localStorage
    const queue = [...syncQueue, newItem];
    localStorage.setItem('mirror-sync-queue', JSON.stringify(queue));

    return newItem.id;
  }, [syncQueue]);

  return {
    isOnline,
    syncQueue,
    addToQueue,
  };
}

/**
 * OfflineIndicator - Simple offline banner
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-accent-yellow)]/10 border-b border-[var(--color-accent-yellow)] p-3"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={16} className="text-[var(--color-accent-yellow)]" />
        <span className="text-sm">
          You are offline. Changes will sync when connection is restored.
        </span>
      </div>
    </motion.div>
  );
}

export type { SyncItem, OfflineSyncProps };
