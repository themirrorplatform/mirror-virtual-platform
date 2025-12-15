/**
 * Offline Sync Queue
 * 
 * Constitutional Principles:
 * - Queue all changes made offline
 * - Auto-sync when connection returns (with user permission)
 * - Clear queue visibility
 * - User controls sync timing
 */

export interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'reflection' | 'thread' | 'identity_axis';
  data: any;
  timestamp: Date;
  retries: number;
  lastError?: string;
}

class OfflineQueueService {
  private readonly QUEUE_KEY = 'mirror_offline_queue';
  private readonly AUTO_SYNC_ENABLED_KEY = 'mirror_auto_sync_enabled';
  private queue: QueuedAction[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    const stored = localStorage.getItem(this.QUEUE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.queue = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      } catch {
        this.queue = [];
      }
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
  }

  /**
   * Add action to queue
   */
  enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): void {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retries: 0,
    };

    this.queue.push(queuedAction);
    this.saveQueue();

    // Try to sync immediately if online
    if (this.isOnline() && this.isAutoSyncEnabled()) {
      this.processQueue();
    }
  }

  /**
   * Process entire queue
   */
  async processQueue(): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    if (this.isProcessing) {
      return { processed: 0, failed: 0, errors: ['Already processing'] };
    }

    if (!this.isOnline()) {
      return { processed: 0, failed: 0, errors: ['Offline'] };
    }

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    const itemsToProcess = [...this.queue];

    for (const item of itemsToProcess) {
      try {
        await this.processAction(item);
        
        // Remove from queue on success
        this.queue = this.queue.filter(q => q.id !== item.id);
        processed++;
      } catch (error) {
        // Increment retries
        const queueItem = this.queue.find(q => q.id === item.id);
        if (queueItem) {
          queueItem.retries++;
          queueItem.lastError = String(error);
          
          // Remove if too many retries
          if (queueItem.retries >= 5) {
            this.queue = this.queue.filter(q => q.id !== item.id);
            errors.push(`${item.type} ${item.entity} failed after 5 retries`);
          }
        }
        
        failed++;
      }
    }

    this.saveQueue();
    this.isProcessing = false;

    return { processed, failed, errors };
  }

  /**
   * Process single action
   */
  private async processAction(action: QueuedAction): Promise<void> {
    // In a real implementation, this would call your sync API
    // For now, this is a mock
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Network error'));
        }
      }, 100);
    });
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    oldestItem: Date | null;
    hasErrors: boolean;
  } {
    return {
      queueLength: this.queue.length,
      oldestItem: this.queue.length > 0 ? this.queue[0].timestamp : null,
      hasErrors: this.queue.some(q => q.retries > 0),
    };
  }

  /**
   * Get all queued items
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Clear queue (user action)
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Check if online
   */
  private isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Check if auto-sync is enabled
   */
  isAutoSyncEnabled(): boolean {
    return localStorage.getItem(this.AUTO_SYNC_ENABLED_KEY) === 'true';
  }

  /**
   * Enable auto-sync
   */
  enableAutoSync(): void {
    localStorage.setItem(this.AUTO_SYNC_ENABLED_KEY, 'true');
  }

  /**
   * Disable auto-sync
   */
  disableAutoSync(): void {
    localStorage.removeItem(this.AUTO_SYNC_ENABLED_KEY);
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      if (this.isAutoSyncEnabled() && this.queue.length > 0) {
        // Small delay to ensure connection is stable
        setTimeout(() => this.processQueue(), 1000);
      }
    });
  }

  /**
   * Get queue summary (for UI)
   */
  getSummary(): string {
    if (this.queue.length === 0) {
      return 'No pending changes';
    }

    const creates = this.queue.filter(q => q.type === 'create').length;
    const updates = this.queue.filter(q => q.type === 'update').length;
    const deletes = this.queue.filter(q => q.type === 'delete').length;

    const parts = [];
    if (creates > 0) parts.push(`${creates} created`);
    if (updates > 0) parts.push(`${updates} updated`);
    if (deletes > 0) parts.push(`${deletes} deleted`);

    return parts.join(', ');
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueService();
