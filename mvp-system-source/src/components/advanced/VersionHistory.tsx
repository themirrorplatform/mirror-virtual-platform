/**
 * Version History - Evolution tracking without judgment
 * 
 * Features:
 * - Track changes over time
 * - View previous versions
 * - Compare differences
 * - Restore versions
 * - No "mistakes" language - only evolution
 * - Constitutional framing: "Then" vs "Now"
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  GitBranch,
  RotateCcw,
  Eye,
  Calendar,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface Version {
  id: string;
  timestamp: Date;
  content: string;
  changes?: {
    added: number;
    removed: number;
    modified: number;
  };
  note?: string;
}

interface VersionHistoryProps {
  versions: Version[];
  currentVersion: Version;
  onRestore?: (versionId: string) => void;
  onCompare?: (versionA: string, versionB: string) => void;
}

export function VersionHistory({
  versions,
  currentVersion,
  onRestore,
  onCompare,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string | null, string | null]>([null, null]);

  const handleVersionClick = (version: Version) => {
    if (compareMode) {
      // Add to compare selection
      if (compareVersions[0] === null) {
        setCompareVersions([version.id, null]);
      } else if (compareVersions[1] === null) {
        setCompareVersions([compareVersions[0], version.id]);
        // Trigger compare
        if (onCompare) {
          onCompare(compareVersions[0]!, version.id);
        }
      } else {
        // Reset
        setCompareVersions([version.id, null]);
      }
    } else {
      setSelectedVersion(version);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-[var(--color-accent-blue)]" />
            <div>
              <h3 className="font-medium">Evolution</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                {versions.length} version{versions.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions([null, null]);
            }}
          >
            <GitBranch size={16} />
            {compareMode ? 'Cancel Compare' : 'Compare'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="md:col-span-1 space-y-2">
          <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
            Timeline
          </h4>
          <div className="space-y-2">
            {versions.map((version, index) => (
              <VersionTimelineItem
                key={version.id}
                version={version}
                isCurrent={version.id === currentVersion.id}
                isSelected={selectedVersion?.id === version.id}
                isCompareSelected={
                  compareVersions[0] === version.id || compareVersions[1] === version.id
                }
                compareIndex={
                  compareVersions[0] === version.id
                    ? 1
                    : compareVersions[1] === version.id
                    ? 2
                    : undefined
                }
                onClick={() => handleVersionClick(version)}
                isFirst={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="md:col-span-2">
          {selectedVersion ? (
            <VersionPreview
              version={selectedVersion}
              isCurrent={selectedVersion.id === currentVersion.id}
              onRestore={() => onRestore?.(selectedVersion.id)}
              onClose={() => setSelectedVersion(null)}
            />
          ) : (
            <Card className="text-center py-12">
              <Eye size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                Select a version to view
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Version Timeline Item

interface VersionTimelineItemProps {
  version: Version;
  isCurrent: boolean;
  isSelected: boolean;
  isCompareSelected: boolean;
  compareIndex?: 1 | 2;
  onClick: () => void;
  isFirst: boolean;
}

function VersionTimelineItem({
  version,
  isCurrent,
  isSelected,
  isCompareSelected,
  compareIndex,
  onClick,
  isFirst,
}: VersionTimelineItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        isSelected || isCompareSelected
          ? 'bg-[var(--color-accent-blue)]/10 border-2 border-[var(--color-accent-blue)]'
          : 'bg-[var(--color-surface-hover)] border-2 border-transparent hover:border-[var(--color-border-subtle)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCurrent
              ? 'bg-[var(--color-accent-blue)] text-white'
              : isCompareSelected
              ? 'bg-[var(--color-accent-purple)] text-white'
              : 'bg-[var(--color-surface-card)]'
          }`}>
            {isCurrent ? (
              <CheckCircle size={16} />
            ) : isCompareSelected ? (
              <span className="text-xs font-medium">{compareIndex}</span>
            ) : (
              <Clock size={16} className="text-[var(--color-text-muted)]" />
            )}
          </div>
          {!isFirst && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[var(--color-border-subtle)]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium">
              {isCurrent ? 'Now' : formatTimestamp(version.timestamp)}
            </p>
            {isCurrent && (
              <Badge variant="success" className="text-xs">
                Current
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {new Date(version.timestamp).toLocaleString()}
          </p>
          {version.changes && (
            <div className="flex items-center gap-2 mt-2 text-xs">
              {version.changes.added > 0 && (
                <span className="text-[var(--color-accent-green)]">
                  +{version.changes.added}
                </span>
              )}
              {version.changes.removed > 0 && (
                <span className="text-[var(--color-border-error)]">
                  -{version.changes.removed}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// Version Preview

interface VersionPreviewProps {
  version: Version;
  isCurrent: boolean;
  onRestore?: () => void;
  onClose: () => void;
}

function VersionPreview({ version, isCurrent, onRestore, onClose }: VersionPreviewProps) {
  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <h3 className="font-medium mb-1">
              {isCurrent ? 'Current Version' : 'Previous Version'}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {new Date(version.timestamp).toLocaleString()}
            </p>
          </div>
          {!isCurrent && onRestore && (
            <Button onClick={onRestore}>
              <RotateCcw size={16} />
              Restore
            </Button>
          )}
        </div>

        {/* Note */}
        {version.note && (
          <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10 border-l-4 border-[var(--color-accent-blue)]">
            <p className="text-sm">{version.note}</p>
          </div>
        )}

        {/* Changes Summary */}
        {version.changes && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-accent-green)]/10">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Added</p>
              <p className="text-xl font-medium text-[var(--color-accent-green)]">
                {version.changes.added}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-border-error)]/10">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Removed</p>
              <p className="text-xl font-medium text-[var(--color-border-error)]">
                {version.changes.removed}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Modified</p>
              <p className="text-xl font-medium text-[var(--color-accent-blue)]">
                {version.changes.modified}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-4 rounded-lg bg-[var(--color-surface-hover)]">
          <p className="text-sm whitespace-pre-wrap">{version.content}</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Version Diff - Compare two versions
 */
interface VersionDiffProps {
  versionA: Version;
  versionB: Version;
}

export function VersionDiff({ versionA, versionB }: VersionDiffProps) {
  const diff = computeDiff(versionA.content, versionB.content);

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Comparison</h3>
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--color-border-error)]/30" />
              <span>Then</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--color-accent-green)]/30" />
              <span>Now</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              {new Date(versionA.timestamp).toLocaleString()}
            </p>
            <div className="p-4 rounded-lg bg-[var(--color-surface-hover)] max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{versionA.content}</pre>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              {new Date(versionB.timestamp).toLocaleString()}
            </p>
            <div className="p-4 rounded-lg bg-[var(--color-surface-hover)] max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{versionB.content}</pre>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Simple diff computation
 */
function computeDiff(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Simple line-by-line comparison
  const changes: Array<{ type: 'added' | 'removed' | 'unchanged'; content: string }> = [];

  const maxLength = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLength; i++) {
    if (i >= oldLines.length) {
      changes.push({ type: 'added', content: newLines[i] });
    } else if (i >= newLines.length) {
      changes.push({ type: 'removed', content: oldLines[i] });
    } else if (oldLines[i] !== newLines[i]) {
      changes.push({ type: 'removed', content: oldLines[i] });
      changes.push({ type: 'added', content: newLines[i] });
    } else {
      changes.push({ type: 'unchanged', content: oldLines[i] });
    }
  }

  return changes;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * useVersionHistory Hook - Manage version state
 */
export function useVersionHistory(initialContent: string) {
  const [versions, setVersions] = useState<Version[]>([
    {
      id: 'initial',
      timestamp: new Date(),
      content: initialContent,
    },
  ]);

  const saveVersion = (content: string, note?: string) => {
    const previous = versions[0];
    const changes = {
      added: content.length - previous.content.length,
      removed: 0,
      modified: 0,
    };

    const newVersion: Version = {
      id: `version-${Date.now()}`,
      timestamp: new Date(),
      content,
      changes,
      note,
    };

    setVersions(prev => [newVersion, ...prev]);
  };

  const restoreVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      saveVersion(version.content, `Restored from ${new Date(version.timestamp).toLocaleString()}`);
      return version.content;
    }
    return null;
  };

  return {
    versions,
    currentVersion: versions[0],
    saveVersion,
    restoreVersion,
  };
}

export type { Version, VersionHistoryProps, VersionDiffProps };
