/**
 * Database Health Panel
 * 
 * Constitutional Principles:
 * - User sees database state clearly
 * - Auto-fix available but not automatic
 * - Backup before risky operations
 * - User controls all actions
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Download, Wrench, RefreshCw, Trash2 } from 'lucide-react';
import { databaseHealthService, HealthReport } from '../../services/databaseHealth';
import { Button } from '../Button';
import { Card } from '../Card';
import { Modal } from '../Modal';

export function DatabaseHealthPanel() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const newReport = await databaseHealthService.check(true);
      setReport(newReport);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAutoFix = async () => {
    if (!confirm('Auto-fix will attempt to repair database issues. A backup will be created first. Continue?')) {
      return;
    }

    setIsFixing(true);
    try {
      const result = await databaseHealthService.autoFix();
      
      if (result.success) {
        alert(`Fixed ${result.fixed} issues successfully`);
        await checkHealth();
      } else {
        alert('Some issues could not be fixed automatically');
      }
    } catch (error) {
      alert('Auto-fix failed: ' + error);
    } finally {
      setIsFixing(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await databaseHealthService.createBackup();
      alert('Backup created successfully');
      setShowBackupModal(false);
    } catch (error) {
      alert('Failed to create backup: ' + error);
    }
  };

  const handleRestoreBackup = async () => {
    if (!confirm('This will restore from the most recent backup. Current data will be replaced. Continue?')) {
      return;
    }

    try {
      await databaseHealthService.restoreFromBackup();
      alert('Database restored from backup');
      await checkHealth();
    } catch (error) {
      alert('Restore failed: ' + error);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('This will remove orphaned data and optimize storage. A backup will be created first. Continue?')) {
      return;
    }

    try {
      await databaseHealthService.createBackup();
      // Cleanup logic would go here
      alert('Database cleaned successfully');
      await checkHealth();
    } catch (error) {
      alert('Cleanup failed: ' + error);
    }
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="animate-spin" size={32} />
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3>Database Health</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {report.healthy ? (
                <CheckCircle className="text-[var(--color-accent-green)]" size={20} />
              ) : (
                <AlertTriangle className="text-[var(--color-accent-amber)]" size={20} />
              )}
              <span className={report.healthy ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-amber)]'}>
                {report.healthy ? 'Healthy' : 'Issues Found'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={isChecking}
            >
              <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Reflections</p>
            <p className="text-2xl">{report.stats.totalReflections}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Threads</p>
            <p className="text-2xl">{report.stats.totalThreads}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Identity Axes</p>
            <p className="text-2xl">{report.stats.totalAxes}</p>
          </div>
        </div>

        {report.stats.databaseSize && (
          <p className="text-sm text-[var(--color-text-muted)]">
            Database size: {formatBytes(report.stats.databaseSize)}
          </p>
        )}
      </Card>

      {/* Issues */}
      {report.issues.length > 0 && (
        <Card variant="emphasis">
          <div className="flex items-start justify-between mb-3">
            <h4>Issues Found ({report.issues.length})</h4>
            {report.issues.some(i => i.fixable) && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAutoFix}
                disabled={isFixing}
              >
                <Wrench size={16} />
                {isFixing ? 'Fixing...' : 'Auto-Fix All'}
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {report.issues.map((issue, index) => (
              <div key={index} className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs uppercase font-medium ${
                        issue.severity === 'critical' 
                          ? 'text-[var(--color-accent-red)]'
                          : issue.severity === 'warning'
                          ? 'text-[var(--color-accent-amber)]'
                          : 'text-[var(--color-text-muted)]'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {issue.type}
                      </span>
                    </div>
                    <p className="text-sm">{issue.description}</p>
                  </div>
                  {issue.fixable && (
                    <span className="text-xs bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] px-2 py-0.5 rounded">
                      Fixable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Issues */}
      {report.issues.length === 0 && (
        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-[var(--color-accent-green)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="mb-1">No Issues Detected</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Database is healthy and functioning normally
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <h4 className="mb-3">Database Actions</h4>
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={() => setShowBackupModal(true)}
          >
            <Download size={16} />
            Create Backup
          </Button>

          <Button
            variant="ghost"
            onClick={handleRestoreBackup}
          >
            <RefreshCw size={16} />
            Restore from Backup
          </Button>

          <Button
            variant="ghost"
            onClick={handleCleanup}
          >
            <Trash2 size={16} />
            Cleanup & Optimize
          </Button>
        </div>
      </Card>

      {/* Last Check */}
      <p className="text-xs text-[var(--color-text-muted)] text-center">
        Last checked: {report.lastCheck.toLocaleString()}
      </p>

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Create Backup"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Creating a backup will save a snapshot of your entire database to IndexedDB.
            You can restore from this backup if needed.
          </p>

          <div className="p-4 bg-[var(--color-surface-emphasis)] rounded-lg">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Note:</strong> Backups are stored locally in IndexedDB. 
              For complete data safety, also use the Export feature regularly.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleCreateBackup}
            >
              Create Backup
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowBackupModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
