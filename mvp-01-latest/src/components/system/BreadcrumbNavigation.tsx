/**
 * Breadcrumb Navigation - Contextual navigation trail
 * 
 * Features:
 * - Current location display
 * - Parent navigation
 * - Context preservation
 * - Mobile-friendly collapse
 * - Semantic markup
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
  maxItems?: number;
}

export function BreadcrumbNavigation({ 
  items, 
  onNavigate,
  maxItems = 4 
}: BreadcrumbNavigationProps) {
  // Collapse breadcrumbs if too many
  const displayItems = items.length > maxItems
    ? [
        items[0],
        { label: '...', path: undefined },
        ...items.slice(-(maxItems - 2))
      ]
    : items;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <ol className="flex items-center gap-2 flex-wrap">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight 
                  size={14} 
                  className="text-[var(--color-text-muted)]" 
                  aria-hidden="true"
                />
              )}
              
              {item.path && !isLast ? (
                <button
                  onClick={() => onNavigate?.(item.path!)}
                  className="flex items-center gap-1.5 text-[var(--color-accent-blue)] hover:underline transition-colors"
                >
                  {Icon && <Icon size={14} />}
                  <span>{item.label}</span>
                </button>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon size={14} />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Compact Breadcrumb - Mobile-optimized version
 */
export function CompactBreadcrumb({ 
  items, 
  onNavigate 
}: BreadcrumbNavigationProps) {
  if (items.length === 0) return null;

  const current = items[items.length - 1];
  const parent = items.length > 1 ? items[items.length - 2] : null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {parent && (
        <>
          <button
            onClick={() => parent.path && onNavigate?.(parent.path)}
            className="text-[var(--color-accent-blue)] hover:underline"
          >
            ← {parent.label}
          </button>
          <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
        </>
      )}
      <span className="text-[var(--color-text-primary)] font-medium" aria-current="page">
        {current.label}
      </span>
    </nav>
  );
}

/**
 * Breadcrumb with dropdown - Show all items in menu
 */
export function BreadcrumbWithDropdown({ 
  items, 
  onNavigate 
}: BreadcrumbNavigationProps) {
  const [showAll, setShowAll] = useState(false);

  if (items.length <= 2) {
    return <BreadcrumbNavigation items={items} onNavigate={onNavigate} />;
  }

  const first = items[0];
  const last = items[items.length - 1];
  const middle = items.slice(1, -1);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm relative">
      <ol className="flex items-center gap-2">
        <li>
          <button
            onClick={() => first.path && onNavigate?.(first.path)}
            className="flex items-center gap-1.5 text-[var(--color-accent-blue)] hover:underline"
          >
            {first.icon && <first.icon size={14} />}
            <span>{first.label}</span>
          </button>
        </li>

        {middle.length > 0 && (
          <>
            <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
            <li className="relative">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-2 py-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
              >
                ...
              </button>

              {showAll && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg shadow-lg py-2 z-10 min-w-48"
                >
                  {middle.map((item, index) => (
                    <button
                      key={`${item.label}-${index}`}
                      onClick={() => {
                        if (item.path) onNavigate?.(item.path);
                        setShowAll(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-secondary)]"
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </li>
          </>
        )}

        <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
        <li>
          <span className="text-[var(--color-text-primary)] font-medium" aria-current="page">
            {last.label}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * useBreadcrumbs Hook - Build breadcrumb trail
 */
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  const items: BreadcrumbItem[] = [
    { label: 'Home', path: '/', icon: Home }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      label: formatSegment(segment),
      path: index === segments.length - 1 ? undefined : currentPath,
    });
  });

  return items;
}

function formatSegment(segment: string): string {
  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export type { BreadcrumbItem, BreadcrumbNavigationProps };