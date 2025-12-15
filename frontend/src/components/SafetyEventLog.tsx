import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

/**
 * SafetyEventLog - Transparent Audit Trail
 * 
 * Features:
 * - Full history of safety interventions
 * - Why each intervention occurred (transparent reasoning)
 * - User override capability tracking
 * - Filter by event type
 * - Constitutional transparency principles
 * 
 * Constitutional Note: You always have the right to know why the AI
 * intervened and the ability to override if you disagree.
 */

export type SafetyEventType =
  | 'harmful_content_blocked'
  | 'bias_warning_shown'
  | 'crisis_resources_offered'
  | 'privacy_alert'
  | 'manipulation_detected'
  | 'boundary_violation_prevented'
  | 'misinformation_flagged';

export type SafetyEventStatus = 'prevented' | 'warned' | 'overridden' | 'acknowledged';

interface SafetyEvent {
  id: string;
  type: SafetyEventType;
  status: SafetyEventStatus;
  timestamp: string;
  context: string;
  reasoning: string;
  detectedPatterns: string[];
  userResponse?: 'override' | 'acknowledge' | 'report_false_positive';
  userFeedback?: string;
  relatedReflection?: {
    id: string;
    title: string;
  };
}

interface SafetyEventLogProps {
  events: SafetyEvent[];
  onViewReflection?: (reflectionId: string) => void;
  onProvideFeedback?: (eventId: string, feedback: string) => void;
}

// Event type metadata
const EVENT_META: Record<SafetyEventType, {
  label: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  description: string;
}> = {
  harmful_content_blocked: {
    label: 'Harmful Content Blocked',
    icon: Shield,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Content that could promote harm was blocked'
  },
  bias_warning_shown: {
    label: 'Bias Warning',
    icon: AlertCircle,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: 'Potential bias detected in reflection'
  },
  crisis_resources_offered: {
    label: 'Crisis Resources Offered',
    icon: Info,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Crisis support resources were suggested'
  },
  privacy_alert: {
    label: 'Privacy Alert',
    icon: Shield,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Potential privacy concern detected'
  },
  manipulation_detected: {
    label: 'Manipulation Detected',
    icon: AlertCircle,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    description: 'Potential manipulative pattern identified'
  },
  boundary_violation_prevented: {
    label: 'Boundary Violation Prevented',
    icon: Shield,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Attempted boundary violation was blocked'
  },
  misinformation_flagged: {
    label: 'Misinformation Flagged',
    icon: AlertCircle,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: 'Potentially false information detected'
  }
};

// Status colors
const statusColors = {
  prevented: 'bg-red-100 text-red-700',
  warned: 'bg-yellow-100 text-yellow-700',
  overridden: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-emerald-100 text-emerald-700'
};

export function SafetyEventLog({
  events,
  onViewReflection,
  onProvideFeedback
}: SafetyEventLogProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const [filterType, setFilterType] = useState<SafetyEventType | 'all'>('all');

  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.type === filterType);

  const handleProvideFeedback = (eventId: string) => {
    const feedback = feedbackInput[eventId]?.trim();
    if (feedback && onProvideFeedback) {
      onProvideFeedback(eventId, feedback);
      setFeedbackInput({ ...feedbackInput, [eventId]: '' });
    }
  };

  // Count by type for filter badges
  const typeCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<SafetyEventType, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-blue-600" />
          Safety Event Log
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Transparent record of all AI safety interventions
        </p>
      </div>

      {/* Constitutional Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">
                Transparency Principle
              </p>
              <p className="text-sm text-blue-800">
                You have the right to know why the AI intervened and the ability to override 
                decisions you disagree with. This log exists to ensure accountability and 
                maintain your autonomy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All Events ({events.length})
            </Button>
            {Object.entries(EVENT_META).map(([type, meta]) => {
              const count = typeCounts[type as SafetyEventType] || 0;
              if (count === 0) return null;
              return (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type as SafetyEventType)}
                  className="flex items-center gap-1"
                >
                  {meta.label} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const meta = EVENT_META[event.type];
            const Icon = meta.icon;
            const isExpanded = expandedEvent === event.id;

            return (
              <Card key={event.id} className={`border-l-4 border-l-blue-500`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                        <CardTitle className="text-lg">{meta.label}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[event.status] + ' border-0'}>
                          {event.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Context */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">What Happened</h4>
                    <p className="text-sm text-gray-700">{event.context}</p>
                  </div>

                  {/* Related Reflection */}
                  {event.relatedReflection && onViewReflection && (
                    <button
                      onClick={() => onViewReflection(event.relatedReflection!.id)}
                      className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full text-left group"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        Related: {event.relatedReflection.title}
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 ml-auto" />
                    </button>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      {/* Reasoning */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          Why This Intervention Occurred
                        </h4>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">{event.reasoning}</p>
                        </div>
                      </div>

                      {/* Detected Patterns */}
                      {event.detectedPatterns.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Detected Patterns
                          </h4>
                          <ul className="space-y-2">
                            {event.detectedPatterns.map((pattern, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-gray-700"
                              >
                                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>{pattern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* User Response */}
                      {event.userResponse && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Your Response
                          </h4>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <Badge variant="outline" className="mb-2">
                              {event.userResponse === 'override' && 'Overridden'}
                              {event.userResponse === 'acknowledge' && 'Acknowledged'}
                              {event.userResponse === 'report_false_positive' && 'Reported as False Positive'}
                            </Badge>
                            {event.userFeedback && (
                              <p className="text-sm text-gray-700 mt-2">{event.userFeedback}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Provide Feedback */}
                      {!event.userFeedback && onProvideFeedback && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Provide Feedback
                          </h4>
                          <div className="space-y-2">
                            <textarea
                              value={feedbackInput[event.id] || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                                setFeedbackInput({
                                  ...feedbackInput,
                                  [event.id]: e.target.value
                                })
                              }
                              placeholder="Was this intervention helpful? Do you think it was a false positive?"
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              rows={3}
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                {(feedbackInput[event.id] || '').length} / 500
                              </span>
                              <Button
                                onClick={() => handleProvideFeedback(event.id)}
                                disabled={!(feedbackInput[event.id]?.trim()) || (feedbackInput[event.id]?.length > 500)}
                                size="sm"
                              >
                                Submit Feedback
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Your feedback helps improve safety systems
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center italic">
                No safety events found with selected filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prevented</p>
                <p className="text-2xl font-bold text-red-700">
                  {events.filter(e => e.status === 'prevented').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Overridden</p>
                <p className="text-2xl font-bold text-blue-700">
                  {events.filter(e => e.status === 'overridden').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Acknowledged</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {events.filter(e => e.status === 'acknowledged').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <SafetyEventLog
 *   events={[
 *     {
 *       id: 'event_123',
 *       type: 'bias_warning_shown',
 *       status: 'acknowledged',
 *       timestamp: '2024-01-15T10:00:00Z',
 *       context: 'While writing a reflection about your coworker, language suggesting attribution bias was detected.',
 *       reasoning: 'The reflection attributed the coworker\'s mistakes to character flaws while attributing your own mistakes to external circumstances—a pattern indicating fundamental attribution bias.',
 *       detectedPatterns: [
 *         'Internal attribution for others\' failures',
 *         'External attribution for own failures',
 *         'Consistency across multiple reflections'
 *       ],
 *       userResponse: 'acknowledge',
 *       userFeedback: 'That\'s a fair point - I hadn\'t noticed this pattern.',
 *       relatedReflection: {
 *         id: 'refl_456',
 *         title: 'Team Dynamics Reflection'
 *       }
 *     }
 *   ]}
 *   onViewReflection={(id) => console.log('View reflection:', id)}
 *   onProvideFeedback={(id, feedback) => console.log('Feedback:', id, feedback)}
 * />
 */

