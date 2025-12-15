/**
 * Constitution Viewer - Browse and search the Mirror constitution
 * 
 * Features:
 * - Section navigation
 * - Full-text search
 * - Amendment history per section
 * - Principle explanations
 * - Copy/share specific sections
 * - "Why this matters" context
 * - Related principles linking
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen,
  Search,
  Link2,
  Copy,
  Check,
  Info,
  ChevronRight,
  History,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConstitutionSection {
  id: string;
  number: string;
  title: string;
  content: string;
  category: 'core' | 'governance' | 'privacy' | 'operation' | 'amendment';
  lastAmended?: Date;
  amendmentCount?: number;
  relatedSections?: string[];
  explanation?: string;
}

interface ConstitutionViewerProps {
  sections: ConstitutionSection[];
  onViewAmendments?: (sectionId: string) => void;
  allowSearch?: boolean;
}

const CATEGORY_CONFIG = {
  core: { label: 'Core Principles', color: '#3B82F6' },
  governance: { label: 'Governance', color: '#8B5CF6' },
  privacy: { label: 'Privacy & Sovereignty', color: '#10B981' },
  operation: { label: 'Operations', color: '#F59E0B' },
  amendment: { label: 'Amendment Process', color: '#EC4899' },
};

export function ConstitutionViewer({
  sections,
  onViewAmendments,
  allowSearch = true,
}: ConstitutionViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const filteredSections = sections.filter(section => {
    const matchesSearch = searchQuery
      ? section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedSections = filteredSections.reduce((acc, section) => {
    if (!acc[section.category]) acc[section.category] = [];
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, ConstitutionSection[]>);

  const handleCopySection = (section: ConstitutionSection) => {
    const text = `${section.number}. ${section.title}\n\n${section.content}`;
    navigator.clipboard.writeText(text);
    setCopiedSection(section.id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-[var(--color-accent-blue)]" />
            <div>
              <h2 className="mb-1">Mirror Constitution</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {sections.length} sections across {Object.keys(CATEGORY_CONFIG).length} categories
              </p>
            </div>
          </div>

          {/* Search */}
          {allowSearch && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                placeholder="Search constitution..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              }`}
            >
              All Sections
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedCategory === key
                    ? 'text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                }`}
                style={{
                  backgroundColor: selectedCategory === key ? config.color : undefined,
                }}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sections */}
      {Object.keys(groupedSections).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSections).map(([category, categorySections]) => (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].color }}
                />
                <h3 className="font-medium">
                  {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].label}
                </h3>
                <Badge variant="secondary">
                  {categorySections.length}
                </Badge>
              </div>

              {/* Sections */}
              <div className="space-y-2">
                {categorySections.map(section => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    isExpanded={expandedSection === section.id}
                    isCopied={copiedSection === section.id}
                    onToggleExpand={() =>
                      setExpandedSection(expandedSection === section.id ? null : section.id)
                    }
                    onCopy={() => handleCopySection(section)}
                    onViewAmendments={onViewAmendments}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Search size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              No sections found
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Try a different search or category
            </p>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>The Constitution is living, but constrained.</strong> Sections can be 
              amended through community governance, but core invariants cannot be changed.
            </p>
            <p className="text-[var(--color-text-muted)]">
              All amendment history is preserved and publicly auditable. No section can be 
              deleted, only amended or superseded.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface SectionCardProps {
  section: ConstitutionSection;
  isExpanded: boolean;
  isCopied: boolean;
  onToggleExpand: () => void;
  onCopy: () => void;
  onViewAmendments?: (sectionId: string) => void;
}

function SectionCard({
  section,
  isExpanded,
  isCopied,
  onToggleExpand,
  onCopy,
  onViewAmendments,
}: SectionCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onToggleExpand}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" size="sm">
                {section.number}
              </Badge>
              <h4 className="font-medium">{section.title}</h4>
              {section.amendmentCount !== undefined && section.amendmentCount > 0 && (
                <Badge variant="warning" size="sm">
                  {section.amendmentCount} amendment{section.amendmentCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {!isExpanded && (
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                {section.content}
              </p>
            )}
          </div>

          <ChevronRight
            size={20}
            className={`text-[var(--color-text-muted)] transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>

        {/* Metadata */}
        {section.lastAmended && (
          <div className="text-xs text-[var(--color-text-muted)]">
            Last amended {formatDate(section.lastAmended)}
          </div>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Full Content */}
              <Card>
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {section.content}
                </p>
              </Card>

              {/* Explanation */}
              {section.explanation && (
                <Card className="border-2 border-[var(--color-accent-blue)]">
                  <div className="flex items-start gap-3">
                    <Info size={14} className="text-[var(--color-accent-blue)] mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium mb-1">Why this matters</h5>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {section.explanation}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Related Sections */}
              {section.relatedSections && section.relatedSections.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Related Sections
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {section.relatedSections.map((relatedId) => (
                      <button
                        key={relatedId}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/10"
                      >
                        <Link2 size={10} />
                        <span>Section {relatedId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  className="flex items-center gap-2"
                >
                  {isCopied ? (
                    <>
                      <Check size={14} className="text-[var(--color-accent-green)]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </Button>

                {onViewAmendments && section.amendmentCount && section.amendmentCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAmendments(section.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <History size={14} />
                    View Amendment History
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

// Utility Functions

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return date.toLocaleDateString();
}

export type { ConstitutionSection };



