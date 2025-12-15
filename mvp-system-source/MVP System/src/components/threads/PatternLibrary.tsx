/**
 * Pattern Library - Browse detected patterns in reflections
 * 
 * Features:
 * - Pattern cards with examples
 * - Frequency indicators
 * - "When does this appear?" analysis
 * - Pattern evolution over time
 * - Related patterns
 * - Mark as "acknowledged" or "working on"
 * - Pattern export
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lightbulb,
  TrendingUp,
  Calendar,
  Link2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface Pattern {
  id: string;
  name: string;
  description: string;
  category: 'behavior' | 'thought' | 'emotion' | 'trigger' | 'response';
  detectedCount: number;
  firstDetected: Date;
  lastDetected: Date;
  examples: string[];
  relatedPatterns?: string[];
  contexts?: string[];
  status?: 'new' | 'acknowledged' | 'working_on' | 'resolved';
  confidence: number; // 0-1
}

interface PatternLibraryProps {
  patterns: Pattern[];
  onViewPattern: (patternId: string) => void;
  onUpdateStatus?: (patternId: string, status: Pattern['status']) => void;
  onHidePattern?: (patternId: string) => void;
}

const CATEGORY_CONFIG = {
  behavior: { label: 'Behavior', color: '#3B82F6', icon: TrendingUp },
  thought: { label: 'Thought', color: '#8B5CF6', icon: Lightbulb },
  emotion: { label: 'Emotion', color: '#EC4899', icon: AlertCircle },
  trigger: { label: 'Trigger', color: '#F59E0B', icon: AlertCircle },
  response: { label: 'Response', color: '#10B981', icon: Check },
};

const STATUS_CONFIG = {
  new: { label: 'New', color: '#3B82F6' },
  acknowledged: { label: 'Acknowledged', color: '#8B5CF6' },
  working_on: { label: 'Working On', color: '#F59E0B' },
  resolved: { label: 'Resolved', color: '#10B981' },
};

export function PatternLibrary({
  patterns,
  onViewPattern,
  onUpdateStatus,
  onHidePattern,
}: PatternLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'frequency' | 'recent' | 'confidence'>('frequency');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const filteredPatterns = patterns
    .filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && (p.status || 'new') !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.detectedCount - a.detectedCount;
        case 'recent':
          return b.lastDetected.getTime() - a.lastDetected.getTime();
        case 'confidence':
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });

  const groupedByCategory = filteredPatterns.reduce((acc, pattern) => {
    if (!acc[pattern.category]) acc[pattern.category] = [];
    acc[pattern.category].push(pattern);
    return acc;
  }, {} as Record<string, Pattern[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Lightbulb size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">Pattern Library</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Category Filter */}
            <div>
              <span className="text-xs text-[var(--color-text-muted)] mb-2 block">
                Category:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  All
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const count = patterns.filter(p => p.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      disabled={count === 0}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        selectedCategory === key
                          ? 'text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                      style={{
                        backgroundColor: selectedCategory === key ? config.color : undefined,
                        opacity: count === 0 ? 0.5 : 1,
                      }}
                    >
                      {config.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status & Sort */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-sm px-3 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
                >
                  <option value="all">All</option>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-sm px-3 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
                >
                  <option value="frequency">Most Frequent</option>
                  <option value="recent">Most Recent</option>
                  <option value="confidence">Highest Confidence</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Patterns */}
      {filteredPatterns.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([category, categoryPatterns]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].color }}
                />
                <h4 className="font-medium">
                  {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].label} Patterns
                </h4>
                <Badge variant="secondary">
                  {categoryPatterns.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {categoryPatterns.map(pattern => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    isExpanded={expandedPattern === pattern.id}
                    onToggleExpand={() =>
                      setExpandedPattern(expandedPattern === pattern.id ? null : pattern.id)
                    }
                    onViewPattern={onViewPattern}
                    onUpdateStatus={onUpdateStatus}
                    onHidePattern={onHidePattern}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card variant="emphasis">
          <div className="text-center py-12">
            <Lightbulb size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              No patterns detected yet
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Continue reflecting and patterns will emerge over time
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
              <strong>Patterns are observations, not judgments.</strong> The system notices 
              recurring themes in your reflections — it doesn't label them as "good" or "bad."
            </p>
            <p className="text-[var(--color-text-muted)]">
              You decide what to do with this information. Patterns can be acknowledged, 
              worked on, or simply observed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Pattern Card

interface PatternCardProps {
  pattern: Pattern;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewPattern: (patternId: string) => void;
  onUpdateStatus?: (patternId: string, status: Pattern['status']) => void;
  onHidePattern?: (patternId: string) => void;
}

function PatternCard({
  pattern,
  isExpanded,
  onToggleExpand,
  onViewPattern,
  onUpdateStatus,
  onHidePattern,
}: PatternCardProps) {
  const categoryConfig = CATEGORY_CONFIG[pattern.category];
  const statusConfig = STATUS_CONFIG[pattern.status || 'new'];
  const Icon = categoryConfig.icon;

  const daysSinceFirst = Math.floor(
    (Date.now() - pattern.firstDetected.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onToggleExpand}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${categoryConfig.color}20`,
                color: categoryConfig.color,
              }}
            >
              <Icon size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{pattern.name}</h4>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${statusConfig.color}20`,
                    color: statusConfig.color,
                  }}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {pattern.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ChevronDown
              size={20}
              className={`text-[var(--color-text-muted)] transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            <span>{pattern.detectedCount}× detected</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Over {daysSinceFirst}d</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{Math.round(pattern.confidence * 100)}% confidence</span>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 pt-3 border-t border-[var(--color-border-subtle)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Examples */}
              <div>
                <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                  Examples:
                </h5>
                <div className="space-y-2">
                  {pattern.examples.slice(0, 3).map((example, index) => (
                    <Card key={index} variant="emphasis">
                      <p className="text-sm text-[var(--color-text-secondary)] italic">
                        "{example}"
                      </p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Contexts */}
              {pattern.contexts && pattern.contexts.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    When does this appear?
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {pattern.contexts.map((context) => (
                      <Badge key={context} variant="secondary" size="sm">
                        {context}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Patterns */}
              {pattern.relatedPatterns && pattern.relatedPatterns.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Related Patterns:
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {pattern.relatedPatterns.map((relatedId) => (
                      <button
                        key={relatedId}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/10"
                        onClick={() => onViewPattern(relatedId)}
                      >
                        <Link2 size={10} />
                        <span>View</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              {onUpdateStatus && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Update Status:
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => onUpdateStatus(pattern.id, key as Pattern['status'])}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          pattern.status === key
                            ? 'text-white'
                            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                        }`}
                        style={{
                          backgroundColor: pattern.status === key ? config.color : undefined,
                        }}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewPattern(pattern.id)}
                >
                  View All Instances
                </Button>
                {onHidePattern && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onHidePattern(pattern.id)}
                    className="flex items-center gap-2"
                  >
                    <EyeOff size={14} />
                    Hide Pattern
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

export type { Pattern };
