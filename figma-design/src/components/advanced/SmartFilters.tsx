/**
 * Smart Filters - Constitutional filtering system
 * 
 * Features:
 * - Time-based filtering
 * - Identity axis filtering
 * - Content type filtering
 * - No algorithmic ranking
 * - No "recommended" filters
 * - User-controlled organization
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter,
  Calendar,
  Tag,
  User,
  Type,
  X,
  Plus,
  Check,
  ChevronDown
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface FilterOption {
  id: string;
  label: string;
  type: 'time' | 'axis' | 'type' | 'custom';
  value: any;
}

interface FilterGroup {
  id: string;
  name: string;
  filters: FilterOption[];
}

interface SmartFiltersProps {
  availableAxes?: string[];
  availableTypes?: string[];
  onFilterChange?: (filters: FilterOption[]) => void;
  initialFilters?: FilterOption[];
}

export function SmartFilters({
  availableAxes = [],
  availableTypes = [],
  onFilterChange,
  initialFilters = [],
}: SmartFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>(initialFilters);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['time']));

  const addFilter = (filter: FilterOption) => {
    const newFilters = [...activeFilters, filter];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
    setShowFilterMenu(false);
  };

  const removeFilter = (filterId: string) => {
    const newFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAll = () => {
    setActiveFilters([]);
    onFilterChange?.([]);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const filterGroups: FilterGroup[] = [
    {
      id: 'time',
      name: 'Time',
      filters: [
        { id: 'today', label: 'Today', type: 'time', value: 'today' },
        { id: 'week', label: 'This week', type: 'time', value: 'week' },
        { id: 'month', label: 'This month', type: 'time', value: 'month' },
        { id: 'year', label: 'This year', type: 'time', value: 'year' },
        { id: 'custom-date', label: 'Custom range', type: 'time', value: 'custom' },
      ],
    },
    {
      id: 'axis',
      name: 'Identity Axis',
      filters: availableAxes.map(axis => ({
        id: `axis-${axis}`,
        label: axis,
        type: 'axis' as const,
        value: axis,
      })),
    },
    {
      id: 'type',
      name: 'Content Type',
      filters: availableTypes.map(type => ({
        id: `type-${type}`,
        label: type,
        type: 'type' as const,
        value: type,
      })),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Filter size={16} />
          Filter
        </Button>

        {activeFilters.map(filter => (
          <FilterChip
            key={filter.id}
            filter={filter}
            onRemove={() => removeFilter(filter.id)}
          />
        ))}

        {activeFilters.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Menu */}
      <AnimatePresence>
        {showFilterMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <div className="space-y-3">
                {filterGroups.map(group => (
                  <FilterGroupSection
                    key={group.id}
                    group={group}
                    isExpanded={expandedGroups.has(group.id)}
                    onToggle={() => toggleGroup(group.id)}
                    activeFilters={activeFilters}
                    onAddFilter={addFilter}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Filter Chip

interface FilterChipProps {
  filter: FilterOption;
  onRemove: () => void;
}

function FilterChip({ filter, onRemove }: FilterChipProps) {
  const Icon = getFilterIcon(filter.type);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]"
    >
      <Icon size={14} />
      <span className="text-sm">{filter.label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-[var(--color-accent-blue)]/20 rounded p-0.5 transition-colors"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

// Filter Group Section

interface FilterGroupSectionProps {
  group: FilterGroup;
  isExpanded: boolean;
  onToggle: () => void;
  activeFilters: FilterOption[];
  onAddFilter: (filter: FilterOption) => void;
}

function FilterGroupSection({
  group,
  isExpanded,
  onToggle,
  activeFilters,
  onAddFilter,
}: FilterGroupSectionProps) {
  const Icon = getFilterIcon(group.filters[0]?.type);

  if (group.filters.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm font-medium">{group.name}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-6 mt-2 space-y-1"
          >
            {group.filters.map(filter => {
              const isActive = activeFilters.some(f => f.id === filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => !isActive && onAddFilter(filter)}
                  disabled={isActive}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] cursor-not-allowed'
                      : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{filter.label}</span>
                    {isActive && <Check size={14} />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getFilterIcon(type: FilterOption['type']) {
  switch (type) {
    case 'time':
      return Calendar;
    case 'axis':
      return User;
    case 'type':
      return Type;
    default:
      return Tag;
  }
}

/**
 * Quick Filters - Preset filter buttons
 */
interface QuickFiltersProps {
  onFilterSelect: (filterId: string) => void;
  activeFilter?: string;
}

export function QuickFilters({ onFilterSelect, activeFilter }: QuickFiltersProps) {
  const quickFilters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'week', label: 'This Week', icon: Calendar },
    { id: 'month', label: 'This Month', icon: Calendar },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {quickFilters.map(filter => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterSelect(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-[var(--color-accent-blue)] text-white'
                : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-blue)]/10'
            }`}
          >
            <Icon size={16} />
            <span className="text-sm">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Filter Builder - Advanced custom filter creation
 */
interface FilterRule {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'before' | 'after' | 'between';
  value: any;
}

interface FilterBuilderProps {
  onSave: (rules: FilterRule[]) => void;
  onCancel: () => void;
}

export function FilterBuilder({ onSave, onCancel }: FilterBuilderProps) {
  const [rules, setRules] = useState<FilterRule[]>([
    {
      id: 'rule-1',
      field: 'content',
      operator: 'contains',
      value: '',
    },
  ]);

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: `rule-${Date.now()}`,
        field: 'content',
        operator: 'contains',
        value: '',
      },
    ]);
  };

  const removeRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const updateRule = (ruleId: string, updates: Partial<FilterRule>) => {
    setRules(rules.map(r => (r.id === ruleId ? { ...r, ...updates } : r)));
  };

  const handleSave = () => {
    onSave(rules.filter(r => r.value !== ''));
  };

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="font-medium">Build Custom Filter</h3>

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={rule.id} className="flex items-center gap-2">
              <select
                value={rule.field}
                onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
              >
                <option value="content">Content</option>
                <option value="date">Date</option>
                <option value="axis">Identity Axis</option>
                <option value="type">Type</option>
              </select>

              <select
                value={rule.operator}
                onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
              >
                <option value="equals">equals</option>
                <option value="contains">contains</option>
                <option value="before">before</option>
                <option value="after">after</option>
                <option value="between">between</option>
              </select>

              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                placeholder="Value..."
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
              />

              {rules.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}>
                  <X size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={addRule} className="w-full">
          <Plus size={16} />
          Add Rule
        </Button>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Filter</Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Saved Filters - Manage saved filter presets
 */
interface SavedFilter {
  id: string;
  name: string;
  filters: FilterOption[];
  createdAt: Date;
}

interface SavedFiltersProps {
  filters: SavedFilter[];
  onApply: (filterId: string) => void;
  onDelete: (filterId: string) => void;
  onRename: (filterId: string, newName: string) => void;
}

export function SavedFilters({ filters, onApply, onDelete, onRename }: SavedFiltersProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (filter: SavedFilter) => {
    setEditingId(filter.id);
    setEditName(filter.name);
  };

  const saveEdit = (filterId: string) => {
    if (editName.trim()) {
      onRename(filterId, editName.trim());
    }
    setEditingId(null);
  };

  if (filters.length === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <Filter size={48} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            No saved filters yet
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {filters.map(filter => (
        <Card key={filter.id} variant="emphasis">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editingId === filter.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveEdit(filter.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(filter.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="px-2 py-1 rounded bg-[var(--color-surface-hover)] border border-[var(--color-accent-blue)]"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => startEdit(filter)}
                  className="text-sm font-medium hover:text-[var(--color-accent-blue)] transition-colors"
                >
                  {filter.name}
                </button>
              )}
              <div className="flex items-center gap-2 mt-1">
                {filter.filters.map(f => (
                  <Badge key={f.id} variant="default" className="text-xs">
                    {f.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onApply(filter.id)}>
                Apply
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(filter.id)}>
                <X size={14} />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * useFilters Hook - Manage filter state
 */
export function useFilters() {
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const addFilter = (filter: FilterOption) => {
    setActiveFilters(prev => [...prev, filter]);
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const saveCurrentFilters = (name: string) => {
    const savedFilter: SavedFilter = {
      id: `saved-${Date.now()}`,
      name,
      filters: activeFilters,
      createdAt: new Date(),
    };
    setSavedFilters(prev => [...prev, savedFilter]);
  };

  const applyFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      setActiveFilters(filter.filters);
    }
  };

  const deleteFilter = (filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const renameFilter = (filterId: string, newName: string) => {
    setSavedFilters(prev =>
      prev.map(f => (f.id === filterId ? { ...f, name: newName } : f))
    );
  };

  return {
    activeFilters,
    savedFilters,
    addFilter,
    removeFilter,
    clearFilters,
    saveCurrentFilters,
    applyFilter,
    deleteFilter,
    renameFilter,
  };
}

export type { FilterOption, FilterGroup, FilterRule, SavedFilter };
