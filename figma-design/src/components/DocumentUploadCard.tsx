import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { FileText, Trash2, Download, Eye, AlertTriangle } from 'lucide-react';

interface DocumentUploadCardProps {
  fileName: string;
  fileSize: number;
  timestamp: string;
  extractedText?: string;
  onDelete?: () => void;
  onUseText?: (text: string) => void;
}

export function DocumentUploadCard({
  fileName,
  fileSize,
  timestamp,
  extractedText,
  onDelete,
  onUseText,
}: DocumentUploadCardProps) {
  const [showExtracted, setShowExtracted] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="mb-6">
      <div className="flex items-start gap-5">
        {/* File Icon */}
        <div className="p-4 rounded-xl bg-[var(--color-accent-green)]/20">
          <FileText size={28} className="text-[var(--color-accent-green)]" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h5 className="text-base mb-2">{fileName}</h5>
              <p className="text-sm text-[var(--color-text-muted)]">
                {timestamp} • {formatFileSize(fileSize)}
              </p>
            </div>
            <button
              onClick={onDelete}
              className="p-2.5 rounded-lg hover:bg-[var(--color-base-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 mb-4">
            <AlertTriangle size={18} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[var(--color-text-secondary)] leading-[1.6]">
              Document processed locally. Text extracted on-device. Original file encrypted and never transmitted.
            </div>
          </div>

          {/* Extracted Text */}
          {extractedText && (
            <div className="border-t border-[var(--color-border-subtle)] pt-4">
              <button
                onClick={() => setShowExtracted(!showExtracted)}
                className="text-base text-[var(--color-accent-green)] hover:underline mb-3 flex items-center gap-2"
              >
                <Eye size={16} />
                {showExtracted ? 'Hide' : 'Show'} Extracted Text
              </button>
              
              {showExtracted && (
                <>
                  <div className="p-5 rounded-xl bg-[var(--color-base-raised)] text-base text-[var(--color-text-secondary)] leading-[1.7] mb-4 max-h-56 overflow-y-auto">
                    {extractedText}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onUseText?.(extractedText)}
                  >
                    Use as Reflection Text
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" size="sm">
              <Download size={16} className="mr-2" />
              Download Original
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}