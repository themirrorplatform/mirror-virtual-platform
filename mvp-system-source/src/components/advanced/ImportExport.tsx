/**
 * Import/Export - Data sovereignty controls
 * 
 * Features:
 * - Export reflections (JSON, Markdown, PDF)
 * - Import from various formats
 * - Complete data portability
 * - Privacy-preserving
 * - No lock-in
 * - Full data transparency
 */

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Download,
  Upload,
  FileJson,
  FileText,
  File,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';

interface ExportOptions {
  format: 'json' | 'markdown' | 'csv' | 'txt';
  includeMetadata?: boolean;
  dateRange?: { start: Date; end: Date };
  filters?: string[];
}

interface ImportResult {
  success: boolean;
  itemsImported: number;
  errors?: string[];
}

interface ImportExportProps {
  onExport: (options: ExportOptions) => Promise<Blob>;
  onImport: (file: File) => Promise<ImportResult>;
}

export function ImportExport({ onExport, onImport }: ImportExportProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Data Sovereignty</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your reflections belong to you. Export or import at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-blue)]/10 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[var(--color-accent-blue)]/10">
                <Download size={20} className="text-[var(--color-accent-blue)]" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Export Data</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Download all your reflections in your preferred format
                </p>
              </div>
            </button>

            {/* Import */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-green)]/10 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[var(--color-accent-green)]/10">
                <Upload size={20} className="text-[var(--color-accent-green)]" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Import Data</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Bring in reflections from another source
                </p>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={async (options) => {
            setIsExporting(true);
            try {
              const blob = await onExport(options);
              downloadBlob(blob, `reflections.${options.format}`);
            } finally {
              setIsExporting(false);
              setShowExportModal(false);
            }
          }}
          isExporting={isExporting}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportResult(null);
          }}
          onImport={async (file) => {
            setIsImporting(true);
            try {
              const result = await onImport(file);
              setImportResult(result);
            } finally {
              setIsImporting(false);
            }
          }}
          isImporting={isImporting}
          result={importResult}
        />
      )}
    </div>
  );
}

/**
 * Export Modal
 */
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}

function ExportModal({ isOpen, onClose, onExport, isExporting }: ExportModalProps) {
  const [format, setFormat] = useState<ExportOptions['format']>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const formats = [
    {
      value: 'json' as const,
      label: 'JSON',
      description: 'Complete data with all metadata',
      icon: FileJson,
    },
    {
      value: 'markdown' as const,
      label: 'Markdown',
      description: 'Human-readable text format',
      icon: FileText,
    },
    {
      value: 'csv' as const,
      label: 'CSV',
      description: 'Spreadsheet-compatible format',
      icon: File,
    },
    {
      value: 'txt' as const,
      label: 'Plain Text',
      description: 'Simple text file',
      icon: FileText,
    },
  ];

  const handleExport = () => {
    onExport({
      format,
      includeMetadata,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Reflections">
      <div className="space-y-4">
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">Export Format</label>
          <div className="space-y-2">
            {formats.map((fmt) => {
              const Icon = fmt.icon;
              return (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    format === fmt.value
                      ? 'bg-[var(--color-accent-blue)]/10 border-2 border-[var(--color-accent-blue)]'
                      : 'bg-[var(--color-surface-hover)] border-2 border-transparent hover:border-[var(--color-border-subtle)]'
                  }`}
                >
                  <Icon size={20} className="text-[var(--color-text-muted)]" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{fmt.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {fmt.description}
                    </div>
                  </div>
                  {format === fmt.value && (
                    <CheckCircle size={20} className="text-[var(--color-accent-blue)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">Options</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Include metadata (dates, tags, etc.)</span>
          </label>
        </div>

        {/* Privacy Notice */}
        <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10 border-l-4 border-[var(--color-accent-blue)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Your data is exported directly to your device. Nothing is sent to any server.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Import Modal
 */
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  isImporting: boolean;
  result: ImportResult | null;
}

function ImportModal({ isOpen, onClose, onImport, isImporting, result }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Reflections">
      <div className="space-y-4">
        {!result ? (
          <>
            {/* File Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Select File</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--color-accent-blue)] transition-colors"
              >
                <Upload size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                      Click to select a file
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Supports JSON, Markdown, CSV, and TXT
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.md,.csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Privacy Notice */}
            <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10 border-l-4 border-[var(--color-accent-blue)]">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Import happens entirely on your device. Your file is not uploaded anywhere.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
              <Button variant="ghost" onClick={onClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
                {isImporting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Result */}
            <div className={`p-4 rounded-lg ${
              result.success
                ? 'bg-[var(--color-accent-green)]/10'
                : 'bg-[var(--color-border-error)]/10'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle size={24} className="text-[var(--color-accent-green)]" />
                ) : (
                  <AlertCircle size={24} className="text-[var(--color-border-error)]" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium mb-1">
                    {result.success ? 'Import Successful' : 'Import Failed'}
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {result.success
                      ? `Imported ${result.itemsImported} reflection${result.itemsImported !== 1 ? 's' : ''}`
                      : 'There was an error importing your data'
                    }
                  </p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-xs text-[var(--color-border-error)]">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Close */}
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/**
 * Quick Export Buttons
 */
interface QuickExportProps {
  onExport: (format: ExportOptions['format']) => void;
}

export function QuickExport({ onExport }: QuickExportProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onExport('json')}
        title="Export as JSON"
      >
        <FileJson size={16} />
        JSON
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onExport('markdown')}
        title="Export as Markdown"
      >
        <FileText size={16} />
        Markdown
      </Button>
    </div>
  );
}

/**
 * Utility Functions
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Helpers
 */
export function exportToJSON(data: any): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: 'application/json' });
}

export function exportToMarkdown(reflections: Array<{
  content: string;
  date: Date;
  tags?: string[];
}>): Blob {
  const markdown = reflections
    .map(r => {
      const header = `# ${r.date.toLocaleDateString()}\n\n`;
      const tags = r.tags ? `Tags: ${r.tags.join(', ')}\n\n` : '';
      return `${header}${tags}${r.content}\n\n---\n\n`;
    })
    .join('');

  return new Blob([markdown], { type: 'text/markdown' });
}

export function exportToCSV(reflections: Array<{
  date: Date;
  content: string;
  tags?: string[];
}>): Blob {
  const headers = 'Date,Content,Tags\n';
  const rows = reflections
    .map(r => {
      const date = r.date.toISOString();
      const content = `"${r.content.replace(/"/g, '""')}"`;
      const tags = `"${r.tags?.join(', ') || ''}"`;
      return `${date},${content},${tags}`;
    })
    .join('\n');

  return new Blob([headers + rows], { type: 'text/csv' });
}

export function exportToText(reflections: Array<{
  content: string;
  date: Date;
}>): Blob {
  const text = reflections
    .map(r => `${r.date.toLocaleDateString()}\n\n${r.content}\n\n${'='.repeat(50)}\n\n`)
    .join('');

  return new Blob([text], { type: 'text/plain' });
}

export type { ExportOptions, ImportResult, ImportExportProps };
