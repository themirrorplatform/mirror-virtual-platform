import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';

/**
 * Timeline - Chronological Event Display
 * 
 * Features:
 * - Vertical timeline with date markers
 * - Multiple event types (amendments, posture changes, milestones)
 * - Color-coded event badges
 * - Expandable event details
 * - Filter by event type
 * - Search by content
 * - Date range selection
 * - Visual connectors between events
 * - Milestone highlighting
 * - Export timeline data
 * 
 * Use cases:
 * - Amendment history
 * - Posture change history
 * - Personal growth milestones
 * - System events log
 */

export type TimelineEventType = 
  | 'amendment' 
  | 'posture_change' 
  | 'milestone' 
  | 'reflection' 
  | 'tension_resolved'
  | 'fork_created'
  | 'vote_completed';

export type EventStatus = 'success' | 'warning' | 'error' | 'info';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  status?: EventStatus;
  metadata?: {
    [key: string]: any;
  };
  details?: string; // Extended details (expandable)
  icon?: React.ReactNode;
}

interface TimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showSearch?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

// Event type configuration
const eventTypeConfig: Record<TimelineEventType, { 
  icon: typeof Clock; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  amendment: { 
    icon: CheckCircle, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    label: 'Amendment'
  },
  posture_change: { 
    icon: TrendingUp, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100',
    label: 'Posture Change'
  },
  milestone: { 
    icon: AlertCircle, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    label: 'Milestone'
  },
  reflection: { 
    icon: Clock, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    label: 'Reflection'
  },
  tension_resolved: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    label: 'Tension Resolved'
  },
  fork_created: { 
    icon: TrendingUp, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100',
    label: 'Fork Created'
  },
  vote_completed: { 
    icon: CheckCircle, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    label: 'Vote Completed'
  }
};

// Status configuration
const statusConfig: Record<EventStatus, { color: string; bgColor: string }> = {
  success: { color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  warning: { color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  error: { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  info: { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' }
};

export function Timeline({
  events,
  onEventClick,
  variant = 'default',
  showSearch = true,
  showFilters = true,
  maxHeight
}: TimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<TimelineEventType>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Filter events
  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!event.title.toLowerCase().includes(query) && 
          !event.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Type filter
    if (selectedTypes.size > 0 && !selectedTypes.has(event.type)) {
      return false;
    }

    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Toggle event expansion
  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Toggle type filter
  const toggleTypeFilter = (type: TimelineEventType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Format date
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Group by date
  const groupedEvents: { date: string; events: TimelineEvent[] }[] = [];
  let currentDate = '';
  
  filteredEvents.forEach(event => {
    const eventDate = new Date(event.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (eventDate !== currentDate) {
      currentDate = eventDate;
      groupedEvents.push({ date: eventDate, events: [event] });
    } else {
      groupedEvents[groupedEvents.length - 1].events.push(event);
    }
  });

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {filteredEvents.slice(0, 5).map(event => {
          const config = eventTypeConfig[event.type];
          const Icon = config.icon;

          return (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 ${config.bgColor} rounded-lg`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Default and detailed variants
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="pl-10"
              />
            </div>
          )}

          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Filter:</span>
              {Object.entries(eventTypeConfig).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type as TimelineEventType)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTypes.has(type as TimelineEventType)
                      ? `${config.bgColor} ${config.color} border-2 border-current`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {config.label}
                </button>
              ))}
              {selectedTypes.size > 0 && (
                <button
                  onClick={() => setSelectedTypes(new Set())}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div 
        className="relative"
        style={{ maxHeight, overflowY: maxHeight ? 'auto' : undefined }}
      >
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {groupedEvents.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-8">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white py-2 z-10">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{group.date}</h3>
            </div>

            {/* Events */}
            <div className="space-y-4">
              {group.events.map((event, eventIdx) => {
                const config = eventTypeConfig[event.type];
                const Icon = event.icon || config.icon;
                const isExpanded = expandedEvents.has(event.id);
                const hasDetails = event.details || event.metadata;

                return (
                  <div key={event.id} className="relative pl-12">
                    {/* Event marker */}
                    <div className={`absolute left-[19px] top-3 p-2 ${config.bgColor} rounded-full border-4 border-white shadow-sm`}>
                      <Icon className={`h-3 w-3 ${config.color}`} />
                    </div>

                    {/* Event content */}
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        event.status ? statusConfig[event.status].bgColor : 'bg-white border-gray-200'
                      } ${onEventClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
                      onClick={() => onEventClick?.(event)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                              {config.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                        </div>
                        {hasDetails && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(event.id);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          {event.details && (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {event.details}
                            </p>
                          )}
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-gray-500">{key}:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No events found</p>
            {(searchQuery || selectedTypes.size > 0) && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTypes(new Set());
                }}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {variant === 'detailed' && filteredEvents.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Events</p>
            <p className="text-xl font-bold text-gray-900">{filteredEvents.length}</p>
          </div>
          {Object.entries(eventTypeConfig).map(([type, config]) => {
            const count = filteredEvents.filter(e => e.type === type).length;
            if (count === 0) return null;
            return (
              <div key={type} className={`p-3 ${config.bgColor} rounded-lg`}>
                <p className={`text-xs ${config.color}`}>{config.label}</p>
                <p className={`text-xl font-bold ${config.color}`}>{count}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * // Amendment history
 * <Timeline
 *   events={[
 *     {
 *       id: '1',
 *       type: 'amendment',
 *       title: 'Article V Amendment Passed',
 *       description: 'Clarified guardian term limits to 2 years',
 *       timestamp: '2024-01-15T10:00:00Z',
 *       status: 'success',
 *       metadata: {
 *         votes_yes: 234,
 *         votes_no: 12,
 *         participation: '87%'
 *       },
 *       details: 'Full text: Guardians shall serve terms of no more than 2 years, with a maximum of 2 consecutive terms.'
 *     },
 *     {
 *       id: '2',
 *       type: 'posture_change',
 *       title: 'Posture Changed to Open',
 *       description: 'Ready to engage with new perspectives',
 *       timestamp: '2024-01-14T14:30:00Z',
 *       status: 'info',
 *       metadata: {
 *         previous: 'grounded',
 *         suggested: 'open',
 *         confidence: 0.85
 *       }
 *     }
 *   ]}
 *   variant="detailed"
 *   showSearch
 *   showFilters
 *   onEventClick={(event) => console.log('Event clicked:', event)}
 * />
 * 
 * // Compact variant
 * <Timeline
 *   variant="compact"
 *   events={[...]}
 *   onEventClick={(event) => router.push(`/events/${event.id}`)}
 * />
 */

