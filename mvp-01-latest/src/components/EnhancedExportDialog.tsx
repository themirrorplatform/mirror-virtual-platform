/**
 * Enhanced Export Dialog
 * 
 * Constitutional Principles:
 * - User controls export format
 * - Preview before export
 * - Multiple format options
 * - Data sovereignty
 */

import { useState } from 'react';
import { Download, FileText, Book, Clock, Mail, File } from 'lucide-react';
import { exportTemplates, ExportFormat } from '../services/exportTemplates';
import { useAppState } from '../hooks/useAppState';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';

interface EnhancedExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedExportDialog({ isOpen, onClose }: EnhancedExportDialogProps) {
  const { reflections, threads } = useAppState();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('journal');
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState('');

  const templates = exportTemplates.getTemplates();

  const handlePreview = () => {
    const template = exportTemplates.getTemplate(selectedFormat);
    if (template) {
      const content = template.generate(reflections, threads);
      setPreview(content.substring(0, 1000) + (content.length > 1000 ? '\n\n...[truncated for preview]' : ''));
      setShowPreview(true);
    }
  };

  const handleExport = () => {
    const { content, filename } = exportTemplates.export(reflections, threads, selectedFormat);
    exportTemplates.download(content, filename);
    onClose();
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'journal': return <FileText size={20} />;
      case 'book': return <Book size={20} />;
      case 'timeline': return <Clock size={20} />;
      case 'letters': return <Mail size={20} />;
      case 'markdown': return <File size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Export Reflections"
      >
        <div className="space-y-4">
          {/* Stats */}
          <Card variant="emphasis">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-medium">{reflections.length}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Reflections</p>
              </div>
              <div>
                <p className="text-2xl font-medium">{threads.length}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Threads</p>
              </div>
              <div>
                <p className="text-2xl font-medium">
                  {(reflections.reduce((sum, r) => sum + r.content.length, 0) / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Characters</p>
              </div>
            </div>
          </Card>

          {/* Format Selection */}
          <div>
            <h4 className="mb-3">Select Format</h4>
            <div className="space-y-2">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedFormat(template.format)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedFormat === template.format
                      ? 'bg-[var(--color-accent-gold)]/20 border-2 border-[var(--color-accent-gold)]'
                      : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface-hover)] border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${
                      selectedFormat === template.format
                        ? 'text-[var(--color-accent-gold)]'
                        : 'text-[var(--color-text-muted)]'
                    }`}>
                      {getFormatIcon(template.format)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">{template.name}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {template.description}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-2">
                        Extension: .{template.fileExtension}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handlePreview}
            >
              <FileText size={16} />
              Preview
            </Button>
            <Button
              variant="default"
              onClick={handleExport}
            >
              <Download size={16} />
              Export
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>

          {/* Format Details */}
          <Card variant="emphasis">
            <h5 className="text-sm font-medium mb-2">About Exports</h5>
            <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>• All exports include your complete reflection content</li>
              <li>• Encrypted reflections are exported as encrypted</li>
              <li>• Exports are plain text files you can edit anywhere</li>
              <li>• No formatting or metadata is lost</li>
              <li>• Keep backups in multiple locations for safety</li>
            </ul>
          </Card>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Export Preview"
      >
        <div className="space-y-4">
          <Card variant="emphasis">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Preview of first 1000 characters:
            </p>
          </Card>

          <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {preview}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => {
                setShowPreview(false);
                handleExport();
              }}
            >
              <Download size={16} />
              Export This Format
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowPreview(false)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
