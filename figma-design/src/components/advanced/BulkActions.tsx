/**
 * Bulk Actions - Multi-item operations
 * 
 * Features:
 * - Select multiple items
 * - Batch operations
 * - Archive, delete, organize
 * - Undo support
 * - Constitutional language (no "bulk delete")
 * - Clear consent for destructive actions
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare,
  Square,
  Archive,
  Trash2,
  Tag,
  FolderInput,
  X,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';

interface BulkActionItem {
  id: string;
  type: 'reflection' | 'thread' | 'post';
  title?: string;
  preview?: string;
}

interface BulkActionsProps {
  items: BulkActionItem[];
  onArchive?: (ids: string[]) => void;
  onDelete?: (ids: string[]) => void;
  onTag?: (ids: string[], tags: string[]) => void;
  onMove?: (ids: string[], destination: string) => void;
  onUndo?: () => void;
}

export function BulkActions({
  items,
  onArchive,
  onDelete,
  onTag,
  onMove,
  onUndo,
}: BulkActionsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'archive' | 'delete' | 'tag' | 'move';
    items: string[];
  } | null>(null);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleArchive = () => {
    const ids = Array.from(selectedIds);
    onArchive?.(ids);
    setLastAction({ type: 'archive', items: ids });
    clearSelection();
  };

  const handleDelete = () => {
    const ids = Array.from(selectedIds);
    onDelete?.(ids);
    setLastAction({ type: 'delete', items: ids });
    setShowDeleteConfirm(false);
    clearSelection();
  };

  const handleTag = (tags: string[]) => {
    const ids = Array.from(selectedIds);
    onTag?.(ids, tags);
    setLastAction({ type: 'tag', items: ids });
    setShowTagModal(false);
    clearSelection();
  };

  const handleMove = (destination: string) => {
    const ids = Array.from(selectedIds);
    onMove?.(ids, destination);
    setLastAction({ type: 'move', items: ids });
    setShowMoveModal(false);
    clearSelection();
  };

  const handleUndo = () => {
    onUndo?.();
    setLastAction(null);
  };

  return (
    <>
      {/* Selection Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare size={20} className="text-[var(--color-accent-blue)]" />
                  <span className="text-sm font-medium">
                    {selectedIds.size} selected
                  </span>
                </div>

                <div className="h-6 w-px bg-[var(--color-border-subtle)]" />

                <div className="flex items-center gap-2">
                  {onArchive && (
                    <Button variant="ghost" size="sm" onClick={handleArchive}>
                      <Archive size={16} />
                      Archive
                    </Button>
                  )}

                  {onTag && (
                    <Button variant="ghost" size="sm" onClick={() => setShowTagModal(true)}>
                      <Tag size={16} />
                      Tag
                    </Button>
                  )}

                  {onMove && (
                    <Button variant="ghost" size="sm" onClick={() => setShowMoveModal(true)}>
                      <FolderInput size={16} />
                      Organize
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-[var(--color-border-error)]"
                    >
                      <Trash2 size={16} />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="h-6 w-px bg-[var(--color-border-subtle)]" />

                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X size={16} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="shadow-lg">
              <div className="flex items-center gap-3">
                <p className="text-sm">
                  {lastAction.type === 'archive' && `Archived ${lastAction.items.length} items`}
                  {lastAction.type === 'delete' && `Removed ${lastAction.items.length} items`}
                  {lastAction.type === 'tag' && `Tagged ${lastAction.items.length} items`}
                  {lastAction.type === 'move' && `Organized ${lastAction.items.length} items`}
                </p>
                <Button variant="ghost" size="sm" onClick={handleUndo}>
                  <RotateCcw size={14} />
                  Undo
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Remove Items"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-border-error)]/10">
              <AlertTriangle size={20} className="text-[var(--color-border-error)] mt-0.5" />
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  This will remove {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}.
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  You can undo this immediately after.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="error" onClick={handleDelete}>
                Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <TagModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          onApply={handleTag}
          itemCount={selectedIds.size}
        />
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <MoveModal
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          onMove={handleMove}
          itemCount={selectedIds.size}
        />
      )}

      {/* Select All Checkbox */}
      <SelectAllCheckbox
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        onToggle={toggleSelectAll}
      />
    </>
  );
}

/**
 * Selectable Item - Wrapper for items that can be selected
 */
interface SelectableItemProps {
  id: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

export function SelectableItem({ id, isSelected, onToggle, children }: SelectableItemProps) {
  return (
    <div className="relative group">
      <motion.div
        animate={{
          scale: isSelected ? 0.98 : 1,
          x: isSelected ? 8 : 0,
        }}
        className={`transition-all ${
          isSelected ? 'ring-2 ring-[var(--color-accent-blue)] rounded-lg' : ''
        }`}
      >
        {children}
      </motion.div>

      <button
        onClick={() => onToggle(id)}
        className={`absolute top-3 left-3 z-10 p-1 rounded transition-all ${
          isSelected
            ? 'bg-[var(--color-accent-blue)] text-white'
            : 'bg-white border-2 border-[var(--color-border-subtle)] text-transparent group-hover:text-[var(--color-text-muted)]'
        }`}
      >
        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>
    </div>
  );
}

/**
 * Select All Checkbox
 */
interface SelectAllCheckboxProps {
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onToggle: () => void;
}

export function SelectAllCheckbox({
  isAllSelected,
  isSomeSelected,
  onToggle,
}: SelectAllCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isAllSelected || isSomeSelected
            ? 'bg-[var(--color-accent-blue)] border-[var(--color-accent-blue)] text-white'
            : 'border-[var(--color-border-subtle)]'
        }`}
      >
        {isAllSelected && <CheckSquare size={16} />}
        {isSomeSelected && !isAllSelected && (
          <div className="w-2 h-2 rounded-sm bg-white" />
        )}
      </div>
      <span className="text-sm">Select all</span>
    </button>
  );
}

/**
 * Tag Modal - Apply tags to multiple items
 */
interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (tags: string[]) => void;
  itemCount: number;
}

function TagModal({ isOpen, onClose, onApply, itemCount }: TagModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const availableTags = ['work', 'personal', 'creative', 'reflection', 'question'];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addNewTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleApply = () => {
    onApply(selectedTags);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Tags">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Apply tags to {itemCount} item{itemCount !== 1 ? 's' : ''}
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium block">Available tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium block">Create new tag</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
              placeholder="Tag name..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
            />
            <Button onClick={addNewTag}>Add</Button>
          </div>
        </div>

        {selectedTags.length > 0 && (
          <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Selected tags:</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded bg-[var(--color-accent-blue)] text-white text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={selectedTags.length === 0}>
            Apply Tags
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Move Modal - Organize items into threads/folders
 */
interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (destination: string) => void;
  itemCount: number;
}

function MoveModal({ isOpen, onClose, onMove, itemCount }: MoveModalProps) {
  const [selectedDestination, setSelectedDestination] = useState<string>('');

  const destinations = [
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'thread-1', label: 'Work Reflections', icon: FolderInput },
    { id: 'thread-2', label: 'Personal Growth', icon: FolderInput },
    { id: 'thread-3', label: 'Creative Ideas', icon: FolderInput },
  ];

  const handleMove = () => {
    if (selectedDestination) {
      onMove(selectedDestination);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Organize Items">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Move {itemCount} item{itemCount !== 1 ? 's' : ''} to:
        </p>

        <div className="space-y-2">
          {destinations.map(dest => {
            const Icon = dest.icon;
            return (
              <button
                key={dest.id}
                onClick={() => setSelectedDestination(dest.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedDestination === dest.id
                    ? 'bg-[var(--color-accent-blue)]/10 border-2 border-[var(--color-accent-blue)]'
                    : 'bg-[var(--color-surface-hover)] border-2 border-transparent hover:border-[var(--color-border-subtle)]'
                }`}
              >
                <Icon size={20} className="text-[var(--color-text-muted)]" />
                <span className="text-sm">{dest.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!selectedDestination}>
            Move Items
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * useBulkActions Hook
 */
export function useBulkActions<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, clearSelection, selectAll]);

  const selectedItems = items.filter(item => selectedIds.has(item.id));

  return {
    selectedIds,
    selectedItems,
    toggleSelect,
    selectAll,
    clearSelection,
    toggleSelectAll,
    isAllSelected: items.length > 0 && selectedIds.size === items.length,
    isSomeSelected: selectedIds.size > 0 && selectedIds.size < items.length,
  };
}

export type { BulkActionItem, BulkActionsProps, SelectableItemProps };
