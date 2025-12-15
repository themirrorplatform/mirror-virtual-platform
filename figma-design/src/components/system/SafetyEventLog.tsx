/**
 * Safety Event Log - Transparent audit log for system actions
 * 
 * Features:
 * - Chronological event list
 * - Event type categorization (consent, data_access, computation, network, error)
 * - Severity levels (info, warning, error, critical)
 * - Filter by type and severity
 * - Export functionality
 * - "Why did this happen?" explainers
 * - Clear/purge options
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield,
  Info,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  Trash2,
  Eye,
  Database,
  Cpu,
  Globe,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

export type EventType = 'consent' | 'data_access' | 'computation' | 'network' | 'error';
export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

interface SafetyEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  details?: Record<string, any>;
  action?: string;
  user?: string;
  resolved?: boolean;
}

interface SafetyEventLogProps {
  events: SafetyEvent[];
  onExport?: () => void;
  onClearLog?: () => void;
  onResolveEvent?: (eventId: string) => void;
  compact?: boolean;
}

const EVENT_TYPE_CONFIG = {
  consent: {
    label: 'Consent',
    icon: <Shield size={16} />,
    color: '#3B82F6',
    description: 'User consent and permission changes',
  },
  data_access: {
    label: 'Data Access',
    icon: <Database size={16} />,
    color: '#8B5CF6',
    description: 'Data read/write operations',
  },
  computation: {
    label: 'Computation',
    icon: <Cpu size={16} />,
    color: '#10B981',
    description: 'AI computations and processing',
  },
  network: {
    label: 'Network',
    icon: <Globe size={16} />,
    color: '#F59E0B',
    description: 'Network requests and external calls',
  },
  error: {
    label: 'Error',
    icon: <XCircle size={16} />,
    color: '#EF4444',
    description: 'System errors and failures',
  },
};

const SEVERITY_CONFIG = {
  info: {
    label: 'Info',
    icon: <Info size={16} />,
    color: '#64748B',
    variant: 'secondary' as const,
  },
  warning: {
    label: 'Warning',
    icon: <AlertTriangle size={16} />,
    color: '#F59E0B',
    variant: 'warning' as const,
  },
  error: {
    label: 'Error',
    icon: <AlertCircle size={16} />,
    color: '#EF4444',
    variant: 'error' as const,
  },
  critical: {
    label: 'Critical',
    icon: <XCircle size={16} />,
    color: '#DC2626',
    variant: 'error' as const,
  },
};

export function SafetyEventLog({
  events,
  onExport,
  onClearLog,
  onResolveEvent,
  compact = false,
}: SafetyEventLogProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<EventSeverity[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filteredEvents = events.filter((event) => {
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(event.type);
    const severityMatch = selectedSeverities.length === 0 || selectedSeverities.includes(event.severity);
    return typeMatch && severityMatch;
  });

  const hasActiveFilters = selectedTypes.length > 0 || selectedSeverities.length > 0;

  const toggleType = (type: EventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleSeverity = (severity: EventSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity) ? prev.filter((s) => s !== severity) : [...prev, severity]
    );
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedSeverities([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">Safety Event Log</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} logged
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Export
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                {hasActiveFilters && (
                  <Badge variant="primary" size="sm">
                    {selectedTypes.length + selectedSeverities.length}
                  </Badge>
                )}
              </Button>
              {onClearLog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearLog}
                  className="flex items-center gap-2 text-[var(--color-border-error)]"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear
                  </Button>
                )}
              </div>

              {/* Event Types */}
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-2">
                  Event Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => toggleType(key as EventType)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                        selectedTypes.includes(key as EventType)
                          ? 'text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                      style={{
                        backgroundColor: selectedTypes.includes(key as EventType)
                          ? config.color
                          : undefined,
                      }}
                    >
                      {config.icon}
                      <span>{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-2">
                  Severity
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => toggleSeverity(key as EventSeverity)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                        selectedSeverities.includes(key as EventSeverity)
                          ? 'text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                      style={{
                        backgroundColor: selectedSeverities.includes(key as EventSeverity)
                          ? config.color
                          : undefined,
                      }}
                    >
                      {config.icon}
                      <span>{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Events List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                expanded={expandedEvent === event.id}
                onToggleExpand={() =>
                  setExpandedEvent(expandedEvent === event.id ? null : event.id)
                }
                onResolve={onResolveEvent ? () => onResolveEvent(event.id) : undefined}
                compact={compact}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card variant="emphasis">
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              No events to display
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Events will appear here as the system operates'}
            </p>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>The Safety Event Log is transparent by design.</strong> Every system 
              action that touches your data or requires consent is logged here.
            </p>
            <p className="text-[var(--color-text-muted)]">
              This log never leaves your device. You can export it at any time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface EventCardProps {
  event: SafetyEvent;
  expanded: boolean;
  onToggleExpand: () => void;
  onResolve?: () => void;
  compact?: boolean;
}

function EventCard({ event, expanded, onToggleExpand, onResolve, compact }: EventCardProps) {
  const typeConfig = EVENT_TYPE_CONFIG[event.type];
  const severityConfig = SEVERITY_CONFIG[event.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card
        className="border-l-4 cursor-pointer transition-all hover:shadow-md"
        style={{ borderLeftColor: severityConfig.color }}
        onClick={onToggleExpand}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div style={{ color: typeConfig.color }}>
                {typeConfig.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium">{event.title}</h4>
                  <Badge variant={severityConfig.variant} size="sm">
                    {severityConfig.label}
                  </Badge>
                  {event.resolved && (
                    <Badge variant="success" size="sm">
                      Resolved
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {event.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {expanded ? (
                <ChevronUp size={20} className="text-[var(--color-text-muted)]" />
              ) : (
                <ChevronDown size={20} className="text-[var(--color-text-muted)]" />
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-[var(--color-text-muted)]">
            {formatTimestamp(event.timestamp)}
            {event.user && ` • ${event.user}`}
          </div>

          {/* Expanded Details */}
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-3 border-t border-[var(--color-border-subtle)] space-y-3"
            >
              {event.details && Object.keys(event.details).length > 0 && (
                <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Details:
                  </p>
                  <div className="space-y-1">
                    {Object.entries(event.details).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-xs">
                        <span className="text-[var(--color-text-muted)] font-medium">
                          {key}:
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.action && (
                <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    <strong className="text-[var(--color-accent-blue)]">Action:</strong>{' '}
                    {event.action}
                  </p>
                </div>
              )}

              {onResolve && !event.resolved && event.severity !== 'info' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve();
                  }}
                  className="flex items-center gap-2"
                >
                  Mark as Resolved
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Utility Functions

function formatTimestamp(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleString();
}

export type { SafetyEvent };
