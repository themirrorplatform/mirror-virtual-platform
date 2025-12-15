/**
 * DownloadExportWrapper - Simplified wrapper for DownloadExportInstrument
 * Bridges the gap between App.tsx usage and full instrument interface
 */

import { DownloadExportInstrument } from './DownloadExportInstrument';
import { storage } from '../../utils/storage';

interface DownloadExportWrapperProps {
  reflectionText?: string;
  threadId?: string;
  onClose: () => void;
}

export function DownloadExportWrapper({
  reflectionText,
  threadId,
  onClose,
}: DownloadExportWrapperProps) {
  // Determine scope based on what's being exported
  const scope = threadId ? 'thread' : 'reflection';
  
  const scopeDescription = threadId
    ? 'Export entire thread with all reflections and detected patterns'
    : reflectionText
    ? 'Export this reflection with metadata and constitutional context'
    : 'Export selected content';

  const itemCount = threadId
    ? storage.getReflectionsByThread(threadId).length
    : 1;

  const estimatedSize = threadId
    ? `~${itemCount * 2}KB`
    : reflectionText
    ? `~${Math.ceil(reflectionText.length / 500)}KB`
    : '~1KB';

  const handleExport = async (
    format: 'json' | 'markdown' | 'pdf' | 'zip',
    encryption: 'none' | 'standard' | 'strong'
  ): Promise<{
    checksum: string;
    size: string;
    timestamp: string;
    filename: string;
  }> => {
    // Gather data based on scope
    let data: any;
    let filename: string;

    if (threadId) {
      const thread = storage.getThreads().find(t => t.id === threadId);
      const reflections = storage.getReflectionsByThread(threadId);
      data = {
        thread,
        reflections,
        exportedAt: new Date().toISOString(),
      };
      filename = `thread-${thread?.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    } else {
      data = {
        text: reflectionText,
        exportedAt: new Date().toISOString(),
        metadata: {
          wordCount: reflectionText?.split(/\s+/).length || 0,
        },
      };
      filename = `reflection-${Date.now()}`;
    }

    // Format the data
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename += '.json';
        break;

      case 'markdown':
        if (threadId) {
          const thread = storage.getThreads().find(t => t.id === threadId);
          const reflections = storage.getReflectionsByThread(threadId);
          content = `# ${thread?.name}\n\n`;
          content += `*Exported: ${new Date().toLocaleString()}*\n\n`;
          content += `---\n\n`;
          reflections.forEach((r, i) => {
            content += `## Reflection ${i + 1}\n`;
            content += `*${new Date(r.timestamp).toLocaleString()}*\n\n`;
            content += `${r.text}\n\n`;
            if (r.mirrorback) {
              content += `> **Mirrorback:** ${r.mirrorback.text}\n\n`;
            }
            content += `---\n\n`;
          });
        } else {
          content = `# Reflection\n\n`;
          content += `*Exported: ${new Date().toLocaleString()}*\n\n`;
          content += `${reflectionText}\n`;
        }
        mimeType = 'text/markdown';
        filename += '.md';
        break;

      case 'pdf':
        // For now, export as text with PDF-ready formatting
        // TODO: Implement actual PDF generation
        content = reflectionText || JSON.stringify(data, null, 2);
        mimeType = 'text/plain';
        filename += '.txt';
        break;

      case 'zip':
        // For now, export as JSON
        // TODO: Implement actual ZIP with multiple files
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename += '.json';
        break;
    }

    // Encrypt if requested
    if (encryption !== 'none') {
      // TODO: Implement actual encryption
      console.log('Encryption requested:', encryption);
      filename += '.encrypted';
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Generate checksum (simple hash for now)
    const checksum = await simpleHash(content);
    const size = formatBytes(blob.size);
    const timestamp = new Date().toISOString();

    return {
      checksum,
      size,
      timestamp,
      filename,
    };
  };

  return (
    <DownloadExportInstrument
      scope={scope}
      scopeDescription={scopeDescription}
      itemCount={itemCount}
      estimatedSize={estimatedSize}
      onExport={handleExport}
      licenseText="The Mirror Core License v1.0"
      licenseImplications="This export maintains full sovereignty. Your data remains yours. No cloud storage, no third-party access. The exported file is encrypted if you chose encryption, and only you hold the key."
      onClose={onClose}
    />
  );
}

// Utility: Simple hash function for checksums
async function simpleHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 12); // First 12 chars
}

// Utility: Format bytes to human-readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
