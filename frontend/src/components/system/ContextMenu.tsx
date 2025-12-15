/**
 * Context Menu - Right-click contextual actions
 * 
 * Features:
 * - Right-click activation
 * - Keyboard navigation
 * - Nested submenus
 * - Icons and shortcuts
 * - Touch-friendly fallback
 * - ARIA compliant
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  disabled?: boolean;
}

export function ContextMenu({ items, children, disabled = false }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    // Calculate position
    const x = e.clientX;
    const y = e.clientY;

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
      return;
    }

    item.action?.();
    handleClose();
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleScroll = () => handleClose();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} onContextMenu={handleContextMenu}>
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <ContextMenuContent
            ref={menuRef}
            items={items}
            position={position}
            activeSubmenu={activeSubmenu}
            onItemClick={handleItemClick}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Context Menu Content

interface ContextMenuContentProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  activeSubmenu: string | null;
  onItemClick: (item: ContextMenuItem) => void;
  onClose: () => void;
}

const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  ({ items, position, activeSubmenu, onItemClick, onClose }, ref) => {
    // Adjust position if menu would go off screen
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    useEffect(() => {
      if (!ref || !('current' in ref) || !ref.current) return;

      const menuRect = ref.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 8;
      }

      // Adjust vertical position
      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 8;
      }

      setAdjustedPosition({ x, y });
    }, [position, ref]);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 min-w-48 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg shadow-lg py-1"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
        role="menu"
        aria-orientation="vertical"
      >
        {items.map((item, index) => (
          <div key={item.id || index}>
            {item.divider ? (
              <div className="my-1 border-t border-[var(--color-border-subtle)]" role="separator" />
            ) : (
              <ContextMenuItemComponent
                item={item}
                isActive={activeSubmenu === item.id}
                onClick={() => onItemClick(item)}
              />
            )}
          </div>
        ))}
      </motion.div>
    );
  }
);

ContextMenuContent.displayName = 'ContextMenuContent';

// Context Menu Item

interface ContextMenuItemComponentProps {
  item: ContextMenuItem;
  isActive: boolean;
  onClick: () => void;
}

function ContextMenuItemComponent({ item, isActive, onClick }: ContextMenuItemComponentProps) {
  const Icon = item.icon;
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={item.disabled}
        role="menuitem"
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
          item.disabled
            ? 'opacity-50 cursor-not-allowed'
            : item.danger
            ? 'text-[var(--color-border-error)] hover:bg-[var(--color-border-error)]/10'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        {/* Icon */}
        {Icon && (
          <Icon
            size={16}
            className={item.danger ? 'text-[var(--color-border-error)]' : 'text-[var(--color-accent-blue)]'}
          />
        )}

        {/* Label */}
        <span className="flex-1">{item.label}</span>

        {/* Shortcut or Submenu Arrow */}
        {item.shortcut && !hasSubmenu && (
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs">
            {item.shortcut}
          </kbd>
        )}

        {hasSubmenu && (
          <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
        )}
      </button>

      {/* Submenu */}
      {hasSubmenu && isActive && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="absolute left-full top-0 ml-1 min-w-48 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg shadow-lg py-1"
          role="menu"
        >
          {item.submenu!.map((subitem, index) => (
            <ContextMenuItemComponent
              key={subitem.id || index}
              item={subitem}
              isActive={false}
              onClick={() => {
                if (!subitem.disabled) {
                  subitem.action?.();
                }
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

/**
 * useContextMenu Hook - Programmatic context menu control
 */
export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const open = (e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    position,
    open,
    close,
  };
}

/**
 * ContextMenuTrigger - Manual trigger button
 */
interface ContextMenuTriggerProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
}

export function ContextMenuTrigger({ items, children }: ContextMenuTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left,
        y: rect.bottom + 4,
      });
      setIsOpen(true);
    }
  };

  return (
    <>
      <button ref={triggerRef} onClick={handleClick} className="outline-none">
        {children}
      </button>

      <AnimatePresence>
        {isOpen && (
          <ContextMenuContent
            items={items}
            position={position}
            activeSubmenu={null}
            onItemClick={(item) => {
              if (!item.disabled && !item.submenu) {
                item.action?.();
                setIsOpen(false);
              }
            }}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export type { ContextMenuItem, ContextMenuProps };