/**
 * Virtual Scroller
 * 
 * Constitutional Principles:
 * - Handle 100,000+ items smoothly
 * - Only render visible items
 * - Maintain scroll position
 * - Accessible keyboard navigation
 */

import { useRef, useState, useEffect, ReactNode } from 'react';

interface VirtualScrollerProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number; // Number of items to render above/below viewport
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualScroller<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
}: VirtualScrollerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  // Add overscan
  const renderStart = Math.max(0, visibleStart - overscan);
  const renderEnd = Math.min(items.length, visibleEnd + overscan);

  const visibleItems = items.slice(renderStart, renderEnd);
  const offsetY = renderStart * itemHeight;

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  // Measure container
  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setContainerHeight(entry.contentRect.height);
        }
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={renderStart + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, renderStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual Grid (for card layouts)
 */
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  columns: number;
  renderItem: (item: T, index: number) => ReactNode;
  gap?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  columns,
  renderItem,
  gap = 16,
  className = '',
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  const visibleStart = Math.floor(scrollTop / rowHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / rowHeight);

  const renderStart = Math.max(0, visibleStart - 2);
  const renderEnd = Math.min(totalRows, visibleEnd + 2);

  const visibleRows = [];
  for (let row = renderStart; row < renderEnd; row++) {
    const rowItems = items.slice(row * columns, (row + 1) * columns);
    visibleRows.push({ row, items: rowItems });
  }

  const offsetY = renderStart * rowHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setContainerHeight(entry.contentRect.height);
        }
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleRows.map(({ row, items: rowItems }) => (
            <div
              key={row}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
                gap: `${gap}px`,
                marginBottom: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const index = row * columns + colIndex;
                return (
                  <div key={index}>
                    {renderItem(item, index)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for scroll position restoration
 */
export function useScrollRestoration(key: string) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKey = `mirror_scroll_${key}`;

  // Restore scroll position on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(stored, 10);
    }
  }, [storageKey]);

  // Save scroll position on unmount
  useEffect(() => {
    const element = scrollRef.current;
    
    return () => {
      if (element) {
        sessionStorage.setItem(storageKey, element.scrollTop.toString());
      }
    };
  }, [storageKey]);

  return scrollRef;
}
