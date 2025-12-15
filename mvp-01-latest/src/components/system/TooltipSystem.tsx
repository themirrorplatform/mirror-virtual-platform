/**
 * Tooltip System - Accessible contextual help
 * 
 * Features:
 * - Hover and focus tooltips
 * - Keyboard accessible
 * - Smart positioning
 * - Delay controls
 * - ARIA compliant
 * - Touch-friendly
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  showArrow?: boolean;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
  disabled = false,
  showArrow = true,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Calculate position
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spacing = 8;
    let x = 0;
    let y = 0;
    let finalPlacement = placement;

    // Calculate position based on placement
    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - spacing;
        
        // Flip to bottom if not enough space
        if (y < 0) {
          finalPlacement = 'bottom';
          y = triggerRect.bottom + spacing;
        }
        break;

      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + spacing;
        
        // Flip to top if not enough space
        if (y + tooltipRect.height > viewportHeight) {
          finalPlacement = 'top';
          y = triggerRect.top - tooltipRect.height - spacing;
        }
        break;

      case 'left':
        x = triggerRect.left - tooltipRect.width - spacing;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        
        // Flip to right if not enough space
        if (x < 0) {
          finalPlacement = 'right';
          x = triggerRect.right + spacing;
        }
        break;

      case 'right':
        x = triggerRect.right + spacing;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        
        // Flip to left if not enough space
        if (x + tooltipRect.width > viewportWidth) {
          finalPlacement = 'left';
          x = triggerRect.left - tooltipRect.width - spacing;
        }
        break;
    }

    // Ensure tooltip stays within viewport horizontally
    if (x < spacing) x = spacing;
    if (x + tooltipRect.width > viewportWidth - spacing) {
      x = viewportWidth - tooltipRect.width - spacing;
    }

    // Ensure tooltip stays within viewport vertically
    if (y < spacing) y = spacing;
    if (y + tooltipRect.height > viewportHeight - spacing) {
      y = viewportHeight - tooltipRect.height - spacing;
    }

    setPosition({ x, y });
    setActualPlacement(finalPlacement);
  }, [isVisible, placement]);

  // Clone child and add event handlers
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
    'aria-describedby': isVisible ? 'tooltip' : undefined,
  });

  return (
    <>
      {trigger}
      {isVisible && createPortal(
        <AnimatePresence>
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 px-3 py-2 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] shadow-lg text-sm text-[var(--color-text-secondary)] max-w-xs"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
            role="tooltip"
            id="tooltip"
          >
            {content}
            
            {/* Arrow */}
            {showArrow && (
              <div
                className="absolute w-2 h-2 bg-[var(--color-surface-primary)] border-[var(--color-border-subtle)] transform rotate-45"
                style={getArrowStyle(actualPlacement)}
              />
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// Arrow positioning
function getArrowStyle(placement: string) {
  const base = { borderWidth: '1px' };
  
  switch (placement) {
    case 'top':
      return { ...base, bottom: '-5px', left: 'calc(50% - 4px)', borderTop: 'none', borderLeft: 'none' };
    case 'bottom':
      return { ...base, top: '-5px', left: 'calc(50% - 4px)', borderBottom: 'none', borderRight: 'none' };
    case 'left':
      return { ...base, right: '-5px', top: 'calc(50% - 4px)', borderLeft: 'none', borderBottom: 'none' };
    case 'right':
      return { ...base, left: '-5px', top: 'calc(50% - 4px)', borderRight: 'none', borderTop: 'none' };
    default:
      return base;
  }
}

/**
 * InfoTooltip - Icon with tooltip
 */
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoTooltip({ content, placement = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} placement={placement}>
      <button className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent-blue)] transition-colors">
        <Info size={14} />
      </button>
    </Tooltip>
  );
}

/**
 * KeyboardTooltip - Show keyboard shortcut in tooltip
 */
interface KeyboardTooltipProps {
  label: string;
  shortcut: string[];
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function KeyboardTooltip({ 
  label, 
  shortcut, 
  children, 
  placement = 'bottom' 
}: KeyboardTooltipProps) {
  const content = (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <div className="flex items-center gap-0.5">
        {shortcut.map((key, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && <span className="mx-0.5 text-xs">+</span>}
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs">
              {key}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <Tooltip content={content} placement={placement}>
      {children}
    </Tooltip>
  );
}

/**
 * HelpTooltip - Rich content tooltip with formatting
 */
interface HelpTooltipProps {
  title: string;
  description: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ 
  title, 
  description, 
  children, 
  placement = 'top' 
}: HelpTooltipProps) {
  const content = (
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
    </div>
  );

  return (
    <Tooltip content={content} placement={placement}>
      {children}
    </Tooltip>
  );
}

/**
 * TooltipProvider - Global tooltip configuration
 */
interface TooltipProviderProps {
  children: React.ReactNode;
  defaultDelay?: number;
  defaultPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipContext = React.createContext({
  delay: 200,
  placement: 'top' as const,
});

export function TooltipProvider({ 
  children, 
  defaultDelay = 200, 
  defaultPlacement = 'top' 
}: TooltipProviderProps) {
  return (
    <TooltipContext.Provider value={{ delay: defaultDelay, placement: defaultPlacement }}>
      {children}
    </TooltipContext.Provider>
  );
}

/**
 * useTooltip Hook - Programmatic tooltip control
 */
export function useTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);

  const show = (tooltipContent: React.ReactNode) => {
    setContent(tooltipContent);
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const toggle = (tooltipContent?: React.ReactNode) => {
    if (tooltipContent) setContent(tooltipContent);
    setIsVisible(prev => !prev);
  };

  return {
    isVisible,
    content,
    show,
    hide,
    toggle,
  };
}

/**
 * ConstitutionalTooltip - Tooltip that follows constitutional principles
 */
interface ConstitutionalTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function ConstitutionalTooltip({ 
  content, 
  children, 
  placement = 'top' 
}: ConstitutionalTooltipProps) {
  // Longer delay - tooltips should not interrupt
  return (
    <Tooltip 
      content={content} 
      placement={placement}
      delay={500} // Longer delay to avoid interruption
    >
      {children}
    </Tooltip>
  );
}

export type { TooltipProps, InfoTooltipProps, KeyboardTooltipProps, HelpTooltipProps };
