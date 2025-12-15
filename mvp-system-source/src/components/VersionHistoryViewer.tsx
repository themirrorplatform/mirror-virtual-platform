/**
 * Version History Viewer
 * 
 * Constitutional Principles:
 * - Optional version history
 * - User controls versioning
 * - See evolution of thought
 * - Diff view available
 */

import { useState, useEffect } from 'react';
import { History, FileText, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { reflectionVersioning, ReflectionVersion, DiffSegment } from '../services/reflectionVersioning';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';

interface VersionHistoryViewerProps {
  reflectionId: string;
  currentContent: string;
  onRestore?: (content: string) => void;
}

export function VersionHistoryViewer({
  reflectionId,
  currentContent,
  onRestore,
}: VersionHistoryViewerProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [versions, setVersions] = useState<ReflectionVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ReflectionVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffSegments, setDiffSegments] = useState<DiffSegment[]>([]);

  useEffect(() => {
    setIsEnabled(reflectionVersioning.isEnabled());
    if (reflectionVersioning.isEnabled()) {
      loadVersions();
    }
  }, [reflectionId]);

  const loadVersions = () => {
    const reflectionVersions = reflectionVersioning.getVersions(reflectionId);
    setVersions(reflectionVersions);
  };

  const handleEnable = () => {
    reflectionVersioning.enable();
    setIsEnabled(true);

    // Create initial version
    reflectionVersioning.createVersion(reflectionId, currentContent, {
      note: 'Initial version',
    });
    loadVersions();
  };

  const handleDisable = () => {
    if (confirm('Disable versioning? Existing versions will be kept but no new versions will be created.')) {
      reflectionVersioning.disable();
      setIsEnabled(false);
    }
  };

  const handleViewDiff = (version: ReflectionVersion) => {
    // Compare with current content or previous version
    const compareWith = currentContent;
    const segments = reflectionVersioning.diff(version.content, compareWith);
    
    setDiffSegments(segments);
    setSelectedVersion(version);
    setShowDiff(true);
  };

  const handleRestore = (version: ReflectionVersion) => {
    if (confirm('Restore this version? Current content will be replaced.')) {
      onRestore?.(version.content);
      
      // Create new version after restore
      reflectionVersioning.createVersion(reflectionId, version.content, {
        note: `Restored from version ${version.versionNumber}`,
        changedBy: 'restore',
      });
      
      loadVersions();
    }
  };

  const handleDelete = (versionId: string) => {
    if (confirm('Delete this version? This cannot be undone.')) {
      reflectionVersioning.deleteVersion(versionId);
      loadVersions();
    }
  };

  const handleSaveVersion = () => {
    const note = prompt('Add a note for this version (optional):');
    
    reflectionVersioning.createVersion(reflectionId, currentContent, {
      note: note || undefined,
    });
    
    loadVersions();
  };

  const stats = reflectionVersioning.getStats(reflectionId);

  if (!isEnabled) {
    return (
      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-[var(--color-text-muted)]/10">
            <History size={24} className="text-[var(--color-text-muted)]" />
          </div>

          <div className="flex-1">
            <h3 className="mb-1">Version History Disabled</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Enable version history to track changes to your reflections over time.
            </p>

            <Button
              variant="default"
              onClick={handleEnable}
            >
              <History size={16} />
              Enable Versioning
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3>Version History</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveVersion}
            >
              Save Version
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisable}
            >
              Disable
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Versions</p>
            <p className="text-2xl">{stats.totalVersions}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">First Version</p>
            <p className="text-sm">
              {stats.firstVersion ? stats.firstVersion.toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Changes</p>
            <p className="text-2xl">{stats.totalChanges}</p>
          </div>
        </div>
      </Card>

      {/* Version List */}
      {versions.length === 0 ? (
        <Card variant="emphasis">
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            No versions saved yet. Click "Save Version" to create the first version.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => {
            const isLatest = index === versions.length - 1;
            
            return (
              <Card key={version.id} variant={isLatest ? 'emphasis' : 'default'}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isLatest 
                        ? 'bg-[var(--color-accent-gold)]/20' 
                        : 'bg-[var(--color-bg-secondary)]'
                    }`}>
                      <span className="text-xs font-medium">v{version.versionNumber}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[var(--color-text-muted)]" />
                        <span className="text-sm text-[var(--color-text-muted)]">
                          {version.createdAt.toLocaleString()}
                        </span>
                        {isLatest && (
                          <span className="text-xs bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] px-2 py-0.5 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                    </div>

                    {version.note && (
                      <p className="text-sm mb-2 italic text-[var(--color-text-secondary)]">
                        "{version.note}"
                      </p>
                    )}

                    <p className="text-sm text-[var(--color-text-muted)] mb-3">
                      {version.content.length} characters
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDiff(version)}
                      >
                        <FileText size={14} />
                        View Diff
                      </Button>

                      {!isLatest && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(version)}
                          >
                            <RotateCcw size={14} />
                            Restore
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(version.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diff Modal */}
      <Modal
        isOpen={showDiff}
        onClose={() => {
          setShowDiff(false);
          setSelectedVersion(null);
          setDiffSegments([]);
        }}
        title={`Version ${selectedVersion?.versionNumber} vs Current`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg max-h-96 overflow-y-auto">
            <div className="space-y-1">
              {diffSegments.map((segment, index) => (
                <span
                  key={index}
                  className={`${
                    segment.type === 'added'
                      ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                      : segment.type === 'removed'
                      ? 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] line-through'
                      : ''
                  }`}
                >
                  {segment.text}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[var(--color-accent-green)]/20 rounded"></div>
              <span className="text-[var(--color-text-secondary)]">Added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[var(--color-accent-red)]/20 rounded"></div>
              <span className="text-[var(--color-text-secondary)]">Removed</span>
            </div>
          </div>

          {selectedVersion && !versions[versions.length - 1] && (
            <Button
              variant="default"
              onClick={() => {
                handleRestore(selectedVersion);
                setShowDiff(false);
              }}
            >
              <RotateCcw size={16} />
              Restore This Version
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
