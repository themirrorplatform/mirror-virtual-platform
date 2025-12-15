/**
 * Database Health Service - Corruption Detection & Recovery
 * 
 * Constitutional Principles:
 * - User always knows the health of their data
 * - Automatic backups before risky operations
 * - Recovery mode if corruption detected
 * - User controls all recovery actions
 */

import { db } from './database';

export interface HealthReport {
  healthy: boolean;
  issues: HealthIssue[];
  lastCheck: Date;
  stats: {
    totalReflections: number;
    totalThreads: number;
    totalAxes: number;
    databaseSize?: number;
  };
}

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  type: 'corruption' | 'orphan' | 'missing_index' | 'large_size';
  description: string;
  fixable: boolean;
  autoFix?: () => Promise<void>;
}

class DatabaseHealthService {
  private lastReport: HealthReport | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Run comprehensive health check
   */
  async check(force: boolean = false): Promise<HealthReport> {
    // Return cached report if recent (unless forced)
    if (!force && this.lastReport) {
      const age = Date.now() - this.lastReport.lastCheck.getTime();
      if (age < this.HEALTH_CHECK_INTERVAL) {
        return this.lastReport;
      }
    }

    const issues: HealthIssue[] = [];

    try {
      // Check 1: Can we open the database?
      await db.init();

      // Check 2: Can we read from each store?
      const [reflections, threads, axes] = await Promise.all([
        db.getAllReflections().catch(() => null),
        db.getAllThreads().catch(() => null),
        db.getAllIdentityAxes().catch(() => null),
      ]);

      if (reflections === null) {
        issues.push({
          severity: 'critical',
          type: 'corruption',
          description: 'Cannot read reflections store',
          fixable: false,
        });
      }

      if (threads === null) {
        issues.push({
          severity: 'critical',
          type: 'corruption',
          description: 'Cannot read threads store',
          fixable: false,
        });
      }

      if (axes === null) {
        issues.push({
          severity: 'critical',
          type: 'corruption',
          description: 'Cannot read identity axes store',
          fixable: false,
        });
      }

      // If we can read data, do integrity checks
      if (reflections && threads) {
        // Check 3: Orphaned reflections (reference non-existent threads)
        const threadIds = new Set(threads.map(t => t.id));
        const orphans = reflections.filter(
          r => r.threadId && !threadIds.has(r.threadId)
        );

        if (orphans.length > 0) {
          issues.push({
            severity: 'warning',
            type: 'orphan',
            description: `${orphans.length} reflections reference non-existent threads`,
            fixable: true,
            autoFix: async () => {
              // Remove thread references from orphaned reflections
              for (const orphan of orphans) {
                await db.updateReflection({
                  ...orphan,
                  threadId: undefined,
                });
              }
            },
          });
        }

        // Check 4: Threads with missing reflections
        for (const thread of threads) {
          const missingRefs = thread.reflectionIds.filter(
            id => !reflections.find(r => r.id === id)
          );

          if (missingRefs.length > 0) {
            issues.push({
              severity: 'warning',
              type: 'orphan',
              description: `Thread "${thread.title}" references ${missingRefs.length} missing reflections`,
              fixable: true,
              autoFix: async () => {
                await db.updateThread({
                  ...thread,
                  reflectionIds: thread.reflectionIds.filter(
                    id => !missingRefs.includes(id)
                  ),
                });
              },
            });
          }
        }

        // Check 5: Database size warning
        const estimatedSize = this.estimateSize(reflections, threads, axes || []);
        if (estimatedSize > 50 * 1024 * 1024) { // 50MB
          issues.push({
            severity: 'info',
            type: 'large_size',
            description: `Database size is large (${this.formatBytes(estimatedSize)}). Consider exporting old data.`,
            fixable: false,
          });
        }

        this.lastReport = {
          healthy: !issues.some(i => i.severity === 'critical'),
          issues,
          lastCheck: new Date(),
          stats: {
            totalReflections: reflections.length,
            totalThreads: threads.length,
            totalAxes: axes?.length || 0,
            databaseSize: estimatedSize,
          },
        };
      } else {
        // Critical corruption
        this.lastReport = {
          healthy: false,
          issues,
          lastCheck: new Date(),
          stats: {
            totalReflections: 0,
            totalThreads: 0,
            totalAxes: 0,
          },
        };
      }
    } catch (error) {
      // Database completely broken
      this.lastReport = {
        healthy: false,
        issues: [
          {
            severity: 'critical',
            type: 'corruption',
            description: `Database initialization failed: ${error}`,
            fixable: false,
          },
        ],
        lastCheck: new Date(),
        stats: {
          totalReflections: 0,
          totalThreads: 0,
          totalAxes: 0,
        },
      };
    }

    return this.lastReport;
  }

  /**
   * Auto-fix all fixable issues
   */
  async autoFix(): Promise<{
    fixed: number;
    failed: number;
    errors: string[];
  }> {
    if (!this.lastReport) {
      await this.check();
    }

    const fixableIssues = this.lastReport!.issues.filter(i => i.fixable && i.autoFix);
    let fixed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const issue of fixableIssues) {
      try {
        await issue.autoFix!();
        fixed++;
      } catch (error) {
        failed++;
        errors.push(`${issue.description}: ${error}`);
      }
    }

    // Re-check after fixes
    await this.check(true);

    return { fixed, failed, errors };
  }

  /**
   * Estimate database size
   */
  private estimateSize(
    reflections: any[],
    threads: any[],
    axes: any[]
  ): number {
    const json = JSON.stringify({ reflections, threads, axes });
    return new Blob([json]).size;
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Create backup before risky operation
   */
  async createBackup(): Promise<string> {
    const data = await db.exportAll();
    const backup = JSON.stringify(data);
    const key = `mirror_backup_${Date.now()}`;
    
    try {
      localStorage.setItem(key, backup);
      return key;
    } catch (error) {
      // localStorage full, return backup data for manual save
      throw new Error('Cannot create backup: storage full');
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupKey: string): Promise<void> {
    const backup = localStorage.getItem(backupKey);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const data = JSON.parse(backup);
    await db.clearAll();
    await db.importAll(data);
  }

  /**
   * List available backups
   */
  listBackups(): Array<{ key: string; date: Date; size: number }> {
    const backups: Array<{ key: string; date: Date; size: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mirror_backup_')) {
        const timestamp = parseInt(key.replace('mirror_backup_', ''), 10);
        const data = localStorage.getItem(key);
        backups.push({
          key,
          date: new Date(timestamp),
          size: data ? new Blob([data]).size : 0,
        });
      }
    }

    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Clear old backups (keep most recent N)
   */
  cleanupBackups(keep: number = 5): void {
    const backups = this.listBackups();
    const toDelete = backups.slice(keep);

    for (const backup of toDelete) {
      localStorage.removeItem(backup.key);
    }
  }
}

// Singleton instance
export const databaseHealthService = new DatabaseHealthService();
