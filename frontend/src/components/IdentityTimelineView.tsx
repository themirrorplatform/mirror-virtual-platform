import React, { useState } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Minus,
  Zap,
  Eye,
  Filter,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * IdentityTimelineView - Temporal Evolution Visualization
 * 
 * Features:
 * - Timeline of identity graph changes over time
 * - Node activations, creations, deletions
 * - Tension emergence and resolution
 * - Pattern shifts visualization
 * - Filter by node type, event type, time range
 * - Zoom to specific periods
 * - Event detail expansion
 * 
 * Constitutional Note: This timeline shows YOUR evolution - a map of
 * how your identity graph has changed. It's for your insight, never shared.
 */

type NodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
type EventType = 'node_created' | 'node_activated' | 'tension_emerged' | 'tension_resolved' | 'pattern_shift' | 'node_strength_change';

interface TimelineEvent {
  id: string;
  timestamp: string;
  eventType: EventType;
  nodeType?: NodeType;
  nodeLabel?: string;
  description: string;
  metadata?: {
    strength?: number;
    tensionEnergy?: number;
    relatedNodes?: string[];
    lensContext?: string[];
  };
}

interface TimelineStats {
  totalEvents: number;
  nodeCreations: number;
  tensionsEmerged: number;
  tensionsResolved: number;
  patternShifts: number;
  mostActiveNodeType: NodeType;
}

interface IdentityTimelineViewProps {
  events: TimelineEvent[];
  stats: TimelineStats;
  onViewNode?: (nodeId: string) => void;
  onViewTension?: (tensionId: string) => void;
}

const eventTypeConfig: Record<EventType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  node_created: { icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Node Created' },
  node_activated: { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Activated' },
  tension_emerged: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Tension Emerged' },
  tension_resolved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Tension Resolved' },
  pattern_shift: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Pattern Shift' },
  node_strength_change: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Strength Change' }
};

const nodeTypeColors: Record<NodeType, string> = {
  thought: 'bg-blue-100 text-blue-700',
  belief: 'bg-purple-100 text-purple-700',
  emotion: 'bg-pink-100 text-pink-700',
  action: 'bg-emerald-100 text-emerald-700',
  experience: 'bg-amber-100 text-amber-700',
  consequence: 'bg-red-100 text-red-700'
};

export function IdentityTimelineView({
  events,
  stats,
  onViewNode,
  onViewTension
}: IdentityTimelineViewProps) {
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<NodeType[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Filter events
  const filteredEvents = events.filter(event => {
    if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(event.eventType)) {
      return false;
    }
    if (selectedNodeTypes.length > 0 && event.nodeType && !selectedNodeTypes.includes(event.nodeType)) {
      return false;
    }
    
    // Time range filter
    if (timeRange !== 'all') {
      const daysAgo = parseInt(timeRange);
      const eventDate = new Date(event.timestamp);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysAgo);
      if (eventDate < cutoff) return false;
    }
    
    return true;
  });

  // Group events by date
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const date = new Date(event.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const toggleEventType = (type: EventType) => {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleNodeType = (type: NodeType) => {
    setSelectedNodeTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleExpanded = (eventId: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-7 w-7 text-blue-600" />
          Identity Timeline
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          How your identity graph has evolved over time
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              <p className="text-xs text-gray-500 mt-1">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.nodeCreations}</p>
              <p className="text-xs text-gray-500 mt-1">Nodes Created</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.tensionsEmerged}</p>
              <p className="text-xs text-gray-500 mt-1">Tensions Emerged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.tensionsResolved}</p>
              <p className="text-xs text-gray-500 mt-1">Tensions Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.patternShifts}</p>
              <p className="text-xs text-gray-500 mt-1">Pattern Shifts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Range */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Range
            </p>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === 'all' ? 'All Time' : `Last ${range}`}
                </button>
              ))}
            </div>
          </div>

          {/* Event Type Filters */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Event Types</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(eventTypeConfig) as EventType[]).map(type => {
                const config = eventTypeConfig[type];
                const isSelected = selectedEventTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleEventType(type)}
                    className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node Type Filters */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Node Types</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(nodeTypeColors) as NodeType[]).map(type => {
                const isSelected = selectedNodeTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleNodeType(type)}
                    className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                      isSelected
                        ? nodeTypeColors[type]
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedEventTypes.length > 0 || selectedNodeTypes.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEventTypes([]);
                setSelectedNodeTypes([]);
              }}
            >
              Clear Filters
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(eventsByDate).length > 0 ? (
          Object.entries(eventsByDate)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, dayEvents]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-gray-300 flex-1" />
                  <p className="text-sm font-medium text-gray-700">{date}</p>
                  <div className="h-px bg-gray-300 flex-1" />
                </div>

                <div className="space-y-3">
                  {dayEvents.map(event => {
                    const config = eventTypeConfig[event.eventType];
                    const Icon = config.icon;
                    const isExpanded = expandedEvents.has(event.id);

                    return (
                      <Card
                        key={event.id}
                        className={`border ${config.bg} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => toggleExpanded(event.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{config.label}</p>
                                  {event.nodeLabel && (
                                    <p className="text-sm text-gray-700 mt-1">{event.nodeLabel}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {event.nodeType && (
                                    <Badge className={`${nodeTypeColors[event.nodeType]} border-0`}>
                                      {event.nodeType}
                                    </Badge>
                                  )}
                                  <p className="text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>

                              <p className="text-sm text-gray-600">{event.description}</p>

                              {isExpanded && event.metadata && (
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                  {event.metadata.strength !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        Strength: <strong>{event.metadata.strength.toFixed(2)}</strong>
                                      </span>
                                    </div>
                                  )}
                                  {event.metadata.tensionEnergy !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        Energy: <strong>{event.metadata.tensionEnergy.toFixed(2)}</strong>
                                      </span>
                                    </div>
                                  )}
                                  {event.metadata.relatedNodes && event.metadata.relatedNodes.length > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Related Nodes:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {event.metadata.relatedNodes.map((nodeId, idx) => (
                                          <button
                                            key={idx}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onViewNode?.(nodeId);
                                            }}
                                            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                          >
                                            {nodeId}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {event.metadata.lensContext && event.metadata.lensContext.length > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Lens Context:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {event.metadata.lensContext.map((lens, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {lens}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center italic">
                No events match the current filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Constitutional Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Your Evolution:</strong> This timeline shows how YOUR identity graph has changed.
            It's a private record of your growth, never shared with others. Use it to understand
            patterns in how you think and feel over time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <IdentityTimelineView
 *   events={[
 *     {
 *       id: 'evt_1',
 *       timestamp: '2024-01-15T10:30:00Z',
 *       eventType: 'node_created',
 *       nodeType: 'belief',
 *       nodeLabel: 'I need to be perfect',
 *       description: 'New belief node created from reflection about work pressure',
 *       metadata: {
 *         strength: 0.75,
 *         lensContext: ['work', 'identity']
 *       }
 *     },
 *     {
 *       id: 'evt_2',
 *       timestamp: '2024-01-15T14:00:00Z',
 *       eventType: 'tension_emerged',
 *       description: 'Tension detected between perfectionism and self-compassion',
 *       metadata: {
 *         tensionEnergy: 0.82,
 *         relatedNodes: ['belief_123', 'emotion_456'],
 *         lensContext: ['work', 'relationships']
 *       }
 *     }
 *   ]}
 *   stats={{
 *     totalEvents: 145,
 *     nodeCreations: 34,
 *     tensionsEmerged: 28,
 *     tensionsResolved: 12,
 *     patternShifts: 8,
 *     mostActiveNodeType: 'emotion'
 *   }}
 *   onViewNode={(nodeId) => console.log('View node:', nodeId)}
 *   onViewTension={(tensionId) => console.log('View tension:', tensionId)}
 * />
 */
