/**
 * Error Recovery Component
 * 
 * Constitutional Principles:
 * - Specific recovery actions for each error type
 * - User never trapped in broken state
 * - Export data before reload
 * - Clear, actionable steps
 */

import { useState } from 'react';
import { AlertTriangle, Download, RefreshCw, FileText } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { db } from '../services/database';

interface ErrorRecoveryProps {
  error: Error;
  resetError: () => void;
}

export function ErrorRecovery({ error, resetError }: ErrorRecoveryProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [hasExported, setHasExported] = useState(false);

  const errorType = classifyError(error);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await db.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirror-backup-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      setHasExported(true);
    } catch (exportError) {
      console.error('Export failed:', exportError);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleReport = () => {
    const reportData = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mirror-error-report-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg-primary)]">
      <Card className="max-w-2xl w-full">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-red)]/10">
            <AlertTriangle size={24} className="text-[var(--color-accent-red)]" />
          </div>

          <div className="flex-1">
            <h2 className="mb-2">Something unexpected occurred</h2>
            
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {getErrorMessage(errorType)}
            </p>

            {/* Error details */}
            <details className="mb-6">
              <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer mb-2">
                Technical details
              </summary>
              <pre className="text-xs bg-[var(--color-bg-secondary)] p-3 rounded-lg overflow-x-auto">
                {error.message}
              </pre>
            </details>

            {/* Recovery actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium mb-2">Recovery options</h3>

              {/* Step 1: Export data */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2">
                    {hasExported 
                      ? 'Your data has been exported' 
                      : 'Export your data first'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting || hasExported}
                  >
                    <Download size={16} />
                    {isExporting ? 'Exporting...' : hasExported ? 'Exported' : 'Export data'}
                  </Button>
                </div>
              </div>

              {/* Step 2: Reload */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2">Reload the application</p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleReload}
                  >
                    <RefreshCw size={16} />
                    Reload
                  </Button>
                </div>
              </div>

              {/* Step 3: Report (optional) */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2">Save error report (optional)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReport}
                  >
                    <FileText size={16} />
                    Save report
                  </Button>
                </div>
              </div>
            </div>

            {/* Specific instructions */}
            {errorType === 'database' && (
              <div className="mt-6 p-4 bg-[var(--color-surface-emphasis)] rounded-lg">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  If the problem persists, your database may be corrupted. 
                  After exporting your data, you can clear all local data from Settings → Data Sovereignty.
                </p>
              </div>
            )}

            {errorType === 'encryption' && (
              <div className="mt-6 p-4 bg-[var(--color-surface-emphasis)] rounded-lg">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Encryption error detected. Your passphrase may be incorrect, 
                  or the encrypted data may be corrupted. Try unlocking with your passphrase again.
                </p>
              </div>
            )}

            {errorType === 'network' && (
              <div className="mt-6 p-4 bg-[var(--color-surface-emphasis)] rounded-lg">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Network error detected. The Mirror works offline, but some features 
                  may require an internet connection. Check your connection and reload.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Classify error type
 */
function classifyError(error: Error): 'database' | 'encryption' | 'network' | 'unknown' {
  const message = error.message.toLowerCase();
  
  if (message.includes('database') || message.includes('indexeddb')) {
    return 'database';
  }
  
  if (message.includes('encrypt') || message.includes('decrypt')) {
    return 'encryption';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'network';
  }
  
  return 'unknown';
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(type: string): string {
  switch (type) {
    case 'database':
      return 'A database error occurred. Your data is safe, but the application needs to reload.';
    case 'encryption':
      return 'An encryption error occurred. Your data remains encrypted and secure.';
    case 'network':
      return 'A network error occurred. The Mirror works offline, so this may be temporary.';
    default:
      return 'An unexpected error occurred. The application needs to reload.';
  }
}
