/**
 * Performance Optimization Utilities
 * Debouncing, throttling, memoization, and monitoring
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Debounce function - delays execution until after wait time
 * Perfect for auto-save, search, and other user input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per interval
 * Perfect for scroll handlers, resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * React hook for debounced value
 * Usage: const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for throttled callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const throttledFn = useMemo(
    () => throttle(callback, limit),
    [callback, limit]
  );

  return throttledFn;
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Array<{ name: string; duration: number }> = [];

  /**
   * Start timing an operation
   */
  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * End timing and record duration
   */
  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark found for "${label}"`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measures.push({ name: label, duration });
    this.marks.delete(label);

    return duration;
  }

  /**
   * Get all measurements
   */
  getMeasures(): Array<{ name: string; duration: number }> {
    return [...this.measures];
  }

  /**
   * Get average duration for a specific operation
   */
  getAverage(name: string): number {
    const relevant = this.measures.filter(m => m.name === name);
    if (relevant.length === 0) return 0;

    const sum = relevant.reduce((acc, m) => acc + m.duration, 0);
    return sum / relevant.length;
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.marks.clear();
    this.measures = [];
  }

  /**
   * Log performance report
   */
  report(): void {
    if (this.measures.length === 0) {
      console.log('No performance measures recorded');
      return;
    }

    console.group('🔍 Performance Report');
    
    // Group by operation name
    const grouped = new Map<string, number[]>();
    this.measures.forEach(m => {
      if (!grouped.has(m.name)) {
        grouped.set(m.name, []);
      }
      grouped.get(m.name)!.push(m.duration);
    });

    // Print summary for each operation
    grouped.forEach((durations, name) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      console.log(`${name}:`);
      console.log(`  Calls: ${durations.length}`);
      console.log(`  Avg: ${avg.toFixed(2)}ms`);
      console.log(`  Min: ${min.toFixed(2)}ms`);
      console.log(`  Max: ${max.toFixed(2)}ms`);
    });

    console.groupEnd();
  }
}

/**
 * Global performance monitor instance
 */
export const perfMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(label: string, enabled: boolean = true): {
  start: () => void;
  end: () => void;
} {
  const start = useCallback(() => {
    if (enabled) {
      perfMonitor.start(label);
    }
  }, [label, enabled]);

  const end = useCallback(() => {
    if (enabled) {
      const duration = perfMonitor.end(label);
      if (duration > 100) {
        console.warn(`⚠️ Slow operation: ${label} took ${duration.toFixed(2)}ms`);
      }
    }
  }, [label, enabled]);

  return { start, end };
}

/**
 * Lazy load component (code splitting)
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> & { preload: () => void } {
  const LazyComponent = React.lazy(factory);
  let factoryPromise: Promise<{ default: T }> | undefined;

  const preload = () => {
    if (!factoryPromise) {
      factoryPromise = factory();
    }
  };

  return Object.assign(LazyComponent, { preload });
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Virtual scrolling utilities for long lists
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
): {
  visibleItems: T[];
  totalHeight: number;
  offsetY: number;
  handleScroll: (scrollTop: number) => void;
} {
  const [scrollTop, setScrollTop] = React.useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

/**
 * Measure render time of a component
 */
export function useRenderTime(componentName: string, enabled: boolean = false): void {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  if (enabled) {
    startTime.current = performance.now();
  }

  useEffect(() => {
    if (enabled) {
      const duration = performance.now() - startTime.current;
      renderCount.current++;
      
      console.log(
        `🎨 ${componentName} render #${renderCount.current}: ${duration.toFixed(2)}ms`
      );
    }
  });
}

/**
 * Batch state updates to prevent unnecessary re-renders
 */
export function useBatchedUpdates<T>(
  initialValue: T,
  delay: number = 100
): [T, (value: T) => void, T] {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  return [value, updateValue, debouncedValue];
}

/**
 * Detect slow renders (for debugging)
 */
export function useSlowRenderDetection(
  componentName: string,
  threshold: number = 16 // One frame at 60fps
): void {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    if (renderTime > threshold) {
      console.warn(
        `⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
    startTime.current = performance.now();
  });
}

// React import for hooks
import React from 'react';
