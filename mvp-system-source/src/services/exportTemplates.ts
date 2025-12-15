/**
 * Export Templates Service
 * 
 * Constitutional Principles:
 * - User controls export format
 * - Templates aid organization, don't impose structure
 * - Multiple formats available
 * - Custom templates possible
 */

import { Reflection, Thread } from './database';

export type ExportFormat = 
  | 'journal' 
  | 'book' 
  | 'timeline' 
  | 'letters' 
  | 'markdown'
  | 'custom';

export interface ExportTemplate {
  id: string;
  name: string;
  format: ExportFormat;
  description: string;
  fileExtension: string;
  generate: (reflections: Reflection[], threads: Thread[]) => string;
}

class ExportTemplatesService {
  /**
   * Get all available templates
   */
  getTemplates(): ExportTemplate[] {
    return [
      this.journalTemplate(),
      this.bookTemplate(),
      this.timelineTemplate(),
      this.lettersTemplate(),
      this.markdownTemplate(),
    ];
  }

  /**
   * Get template by format
   */
  getTemplate(format: ExportFormat): ExportTemplate | null {
    return this.getTemplates().find(t => t.format === format) || null;
  }

  /**
   * Journal format: Dated entries
   */
  private journalTemplate(): ExportTemplate {
    return {
      id: 'journal',
      name: 'Journal Format',
      format: 'journal',
      description: 'Dated entries, chronological order',
      fileExtension: 'md',
      generate: (reflections, threads) => {
        let output = '# Reflections Journal\n\n';

        // Group by date
        const byDate = new Map<string, Reflection[]>();
        for (const reflection of reflections) {
          const dateKey = reflection.createdAt.toISOString().split('T')[0];
          if (!byDate.has(dateKey)) {
            byDate.set(dateKey, []);
          }
          byDate.get(dateKey)!.push(reflection);
        }

        // Sort dates
        const sortedDates = Array.from(byDate.keys()).sort();

        for (const date of sortedDates) {
          const dateObj = new Date(date);
          const formatted = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          output += `## ${formatted}\n\n`;

          const dayReflections = byDate.get(date)!;
          for (const reflection of dayReflections) {
            const time = reflection.createdAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            output += `### ${time}\n\n`;
            output += `${reflection.content}\n\n`;

            if (reflection.identityAxis) {
              output += `*As ${reflection.identityAxis}*\n\n`;
            }

            output += '---\n\n';
          }
        }

        return output;
      },
    };
  }

  /**
   * Book format: Chapters by thread
   */
  private bookTemplate(): ExportTemplate {
    return {
      id: 'book',
      name: 'Book Format',
      format: 'book',
      description: 'Chapters organized by threads',
      fileExtension: 'md',
      generate: (reflections, threads) => {
        let output = '# The Mirror\n\n';
        output += `*A collection of reflections*\n\n`;
        output += '---\n\n';

        // Reflections by thread
        for (const thread of threads) {
          output += `# ${thread.title}\n\n`;

          const threadReflections = reflections
            .filter(r => r.threadId === thread.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

          for (const reflection of threadReflections) {
            output += `${reflection.content}\n\n`;
            output += `*${reflection.createdAt.toLocaleDateString()}*\n\n`;
            output += '---\n\n';
          }
        }

        // Unthreaded reflections
        const unthreaded = reflections.filter(r => !r.threadId);
        if (unthreaded.length > 0) {
          output += `# Standalone Reflections\n\n`;

          for (const reflection of unthreaded) {
            output += `${reflection.content}\n\n`;
            output += `*${reflection.createdAt.toLocaleDateString()}*\n\n`;
            output += '---\n\n';
          }
        }

        return output;
      },
    };
  }

  /**
   * Timeline format: Chronological with context
   */
  private timelineTemplate(): ExportTemplate {
    return {
      id: 'timeline',
      name: 'Timeline Format',
      format: 'timeline',
      description: 'Chronological order with timestamps',
      fileExtension: 'txt',
      generate: (reflections, threads) => {
        let output = 'REFLECTIONS TIMELINE\n';
        output += '='.repeat(80) + '\n\n';

        const sorted = [...reflections].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        for (const reflection of sorted) {
          const datetime = reflection.createdAt.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          output += `[${datetime}]\n`;

          if (reflection.identityAxis) {
            output += `Identity: ${reflection.identityAxis}\n`;
          }

          if (reflection.threadId) {
            const thread = threads.find(t => t.id === reflection.threadId);
            if (thread) {
              output += `Thread: ${thread.title}\n`;
            }
          }

          output += '\n';
          output += reflection.content + '\n';
          output += '\n' + '-'.repeat(80) + '\n\n';
        }

        return output;
      },
    };
  }

  /**
   * Letters format: Each reflection as a letter to self
   */
  private lettersTemplate(): ExportTemplate {
    return {
      id: 'letters',
      name: 'Letters to Self',
      format: 'letters',
      description: 'Each reflection formatted as a letter',
      fileExtension: 'md',
      generate: (reflections, threads) => {
        let output = '# Letters to Myself\n\n';

        const sorted = [...reflections].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        for (let i = 0; i < sorted.length; i++) {
          const reflection = sorted[i];
          const date = reflection.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          output += `## Letter ${i + 1}\n\n`;
          output += `*${date}*\n\n`;

          if (reflection.identityAxis) {
            output += `Dear ${reflection.identityAxis},\n\n`;
          } else {
            output += `Dear Self,\n\n`;
          }

          output += reflection.content + '\n\n';
          output += '---\n\n';
        }

        return output;
      },
    };
  }

  /**
   * Markdown format: Simple markdown export
   */
  private markdownTemplate(): ExportTemplate {
    return {
      id: 'markdown',
      name: 'Simple Markdown',
      format: 'markdown',
      description: 'Basic markdown format',
      fileExtension: 'md',
      generate: (reflections, threads) => {
        let output = '# Reflections\n\n';

        const sorted = [...reflections].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        for (const reflection of sorted) {
          const date = reflection.createdAt.toLocaleDateString('en-US');
          output += `## ${date}\n\n`;
          output += `${reflection.content}\n\n`;
        }

        return output;
      },
    };
  }

  /**
   * Export using template
   */
  export(
    reflections: Reflection[],
    threads: Thread[],
    format: ExportFormat
  ): { content: string; filename: string } {
    const template = this.getTemplate(format);
    if (!template) {
      throw new Error(`Unknown export format: ${format}`);
    }

    const content = template.generate(reflections, threads);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `mirror-${format}-${timestamp}.${template.fileExtension}`;

    return { content, filename };
  }

  /**
   * Download export file
   */
  download(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const exportTemplates = new ExportTemplatesService();
