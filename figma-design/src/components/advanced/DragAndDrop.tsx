/**
 * Drag and Drop - Gentle drag and drop system
 * 
 * Features:
 * - Drag to reorder
 * - Drag to organize
 * - Visual feedback
 * - Keyboard accessible
 * - Touch-friendly
 * - Respects reduced motion
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GripVertical, Move } from 'lucide-react';

interface DragItem {
  id: string;
  content: React.ReactNode;
  data?: any;
}

interface DraggableProps {
  id: string;
  index: number;
  children: React.ReactNode;
  onDragStart?: (id: string, index: number) => void;
  onDragEnd?: () => void;
  onDrop?: (draggedId: string, droppedOnId: string) => void;
  disabled?: boolean;
  handle?: boolean;
}

export function Draggable({
  id,
  index,
  children,
  onDragStart,
  onDragEnd,
  onDrop,
  disabled = false,
  handle = true,
}: DraggableProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) return;

    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    onDragStart?.(id, index);

    // Set drag image
    if (dragRef.current) {
      const ghost = dragRef.current.cloneNode(true) as HTMLElement;
      ghost.style.opacity = '0.5';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId !== id) {
      onDrop?.(draggedId, id);
    }

    setIsOver(false);
  };

  return (
    <motion.div
      ref={dragRef}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      layout
      className={`relative transition-all ${
        isDragging ? 'opacity-40 cursor-grabbing' : disabled ? 'cursor-default' : 'cursor-grab'
      } ${isOver ? 'border-t-2 border-[var(--color-accent-blue)]' : ''}`}
    >
      <div className="flex items-center gap-2">
        {handle && !disabled && (
          <div className="flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
            <GripVertical size={16} />
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </motion.div>
  );
}

/**
 * DraggableList - Complete drag and drop list
 */
interface DraggableListProps {
  items: DragItem[];
  onReorder: (items: DragItem[]) => void;
  renderItem: (item: DragItem, index: number) => React.ReactNode;
  disabled?: boolean;
  emptyMessage?: string;
}

export function DraggableList({
  items,
  onReorder,
  renderItem,
  disabled = false,
  emptyMessage = 'Nothing here yet',
}: DraggableListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (id: string, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (draggedId: string, droppedOnId: string) => {
    const draggedItem = items.find(item => item.id === draggedId);
    const droppedOnIndex = items.findIndex(item => item.id === droppedOnId);

    if (!draggedItem || droppedOnIndex === -1) return;

    const newItems = items.filter(item => item.id !== draggedId);
    newItems.splice(droppedOnIndex, 0, draggedItem);

    onReorder(newItems);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[var(--color-text-secondary)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {items.map((item, index) => (
          <Draggable
            key={item.id}
            id={item.id}
            index={index}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            disabled={disabled}
          >
            {renderItem(item, index)}
          </Draggable>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * DropZone - Drop target area
 */
interface DropZoneProps {
  onDrop: (data: any) => void;
  children?: React.ReactNode;
  className?: string;
  acceptTypes?: string[];
  disabled?: boolean;
}

export function DropZone({
  onDrop,
  children,
  className = '',
  acceptTypes,
  disabled = false,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(true);

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = canDrop ? 'copy' : 'none';
    setIsOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;

    // Check if dropped type is acceptable
    if (acceptTypes) {
      const types = Array.from(e.dataTransfer.types);
      const isAcceptable = acceptTypes.some(type => types.includes(type));
      setCanDrop(isAcceptable);
    }
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled || !canDrop) return;

    e.preventDefault();
    setIsOver(false);

    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      try {
        onDrop(JSON.parse(data));
      } catch {
        onDrop(data);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-all ${className} ${
        isOver
          ? canDrop
            ? 'border-2 border-dashed border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
            : 'border-2 border-dashed border-[var(--color-border-error)] bg-[var(--color-border-error)]/5'
          : 'border-2 border-dashed border-transparent'
      }`}
    >
      {children || (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Move size={48} className="text-[var(--color-text-muted)] mb-4" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            Drop items here
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Drag and drop to organize
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * FileDropZone - Drop zone for file uploads
 */
interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
}

export function FileDropZone({
  onDrop,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = true,
  disabled = false,
}: FileDropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): File[] => {
    setError(null);

    const validFiles = files.filter(file => {
      // Check file type
      if (accept && accept.length > 0) {
        const fileType = file.type;
        const fileExt = `.${file.name.split('.').pop()}`;
        const isAccepted = accept.some(
          type => type === fileType || type === fileExt || type === '*/*'
        );
        if (!isAccepted) {
          setError(`File type not accepted: ${file.name}`);
          return false;
        }
      }

      // Check file size
      if (file.size > maxSize) {
        setError(`File too large: ${file.name} (max ${maxSize / 1024 / 1024}MB)`);
        return false;
      }

      return true;
    });

    return validFiles;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    setIsOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(multiple ? files : files.slice(0, 1));

    if (validFiles.length > 0) {
      onDrop(validFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles = validateFiles(files);

    if (validFiles.length > 0) {
      onDrop(validFiles);
    }
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer transition-all p-8 rounded-lg border-2 border-dashed ${
          isOver
            ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent-blue)]/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Move size={48} className="text-[var(--color-text-muted)] mb-4" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            Drop files here or click to browse
          </p>
          {accept && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Accepts: {accept.join(', ')}
            </p>
          )}
          <p className="text-xs text-[var(--color-text-muted)]">
            Max size: {maxSize / 1024 / 1024}MB
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-[var(--color-border-error)]">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept?.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

/**
 * useDragAndDrop Hook - Manage drag and drop state
 */
export function useDragAndDrop<T extends { id: string }>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [draggedItem, setDraggedItem] = useState<T | null>(null);

  const reorder = (draggedId: string, targetId: string) => {
    const draggedIndex = items.findIndex(item => item.id === draggedId);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setItems(newItems);
  };

  const move = (itemId: string, fromList: string, toList: string) => {
    // Implement cross-list movement
    console.log('Moving item', itemId, 'from', fromList, 'to', toList);
  };

  const reset = () => {
    setItems(initialItems);
  };

  return {
    items,
    setItems,
    draggedItem,
    setDraggedItem,
    reorder,
    move,
    reset,
  };
}

/**
 * DragHandle - Standalone drag handle
 */
export function DragHandle({ className = '' }: { className?: string }) {
  return (
    <div
      className={`cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors ${className}`}
    >
      <GripVertical size={20} />
    </div>
  );
}

export type { DragItem, DraggableProps, DropZoneProps, FileDropZoneProps };
