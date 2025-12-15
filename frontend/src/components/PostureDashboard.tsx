import React, { useState } from 'react';
import { Activity, HelpCircle, AlertCircle, Shield, Smile, Lightbulb, Sparkles, TrendingUp, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * PostureDashboard - Comprehensive Posture Display
 * 
 * Features:
 * - Current posture large display with icon
 * - Posture history timeline (last 7 days)
 * - Suggested posture with AI reasoning
 * - "Why this suggestion?" explainer
 * - Divergence alert when declared ≠ suggested
 * - Quick posture change action
 * 
 * Constitutional Note: Posture is self-declared, not prescribed.
 * AI suggestions are data, not directives. You're always in control.
 */

type Posture = 'unknown' | 'overwhelmed' | 'guarded' | 'grounded' | 'open' | 'exploratory';

interface PostureHistory {
  date: string;
  posture: Posture;
  declaredAt: string;
}

interface PostureSuggestion {
  suggestedPosture: Posture;
  confidence: number; // 0-1
  reasoning: string;
  factorsConsidered: string[];
}

interface PostureDashboardProps {
  currentPosture: Posture;
  postureHistory: PostureHistory[];
  suggestion?: PostureSuggestion;
  onChangePosture?: () => void;
}

// Posture metadata
const POSTURE_META: Record<Posture, {
  icon: typeof HelpCircle;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}> = {
  unknown: {
    icon: HelpCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Unknown',
    description: 'Not yet declared or unsure of current state'
  },
  overwhelmed: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Overwhelmed',
    description: 'High cognitive load, need to reduce information flow'
  },
  guarded: {
    icon: Shield,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Guarded',
    description: 'Cautious, need to build trust before exploring'
  },
  grounded: {
    icon: Smile,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Grounded',
    description: 'Stable, balanced, ready for moderate engagement'
  },
  open: {
    icon: Lightbulb,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Open',
    description: 'Receptive, ready to engage with new perspectives'
  },
  exploratory: {
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Exploratory',
    description: 'Actively seeking novelty, high capacity for complexity'
  }
};

export function PostureDashboard({
  currentPosture,
  postureHistory,
  suggestion,
  onChangePosture
}: PostureDashboardProps) {
  const [showReasoningDetails, setShowReasoningDetails] = useState(false);

  const currentMeta = POSTURE_META[currentPosture];
  const CurrentIcon = currentMeta.icon;

  // Check for divergence
  const hasDivergence = suggestion && suggestion.suggestedPosture !== currentPosture;

  // Format time since last change
  const getTimeSinceChange = () => {
    if (postureHistory.length === 0) return 'Never declared';
    const lastChange = new Date(postureHistory[0].declaredAt);
    const now = new Date();
    const diffMs = now.getTime() - lastChange.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Current Posture Display */}
      <Card className={`border-l-4 ${currentMeta.color.replace('text-', 'border-l-')}`}>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Icon */}
            <div className={`${currentMeta.bgColor} p-6 rounded-full`}>
              <CurrentIcon className={`h-16 w-16 ${currentMeta.color}`} />
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{currentMeta.label}</h2>
                <Badge className={`${currentMeta.bgColor} ${currentMeta.color} border-0`}>
                  Current
                </Badge>
              </div>
              <p className="text-gray-600 mb-4">{currentMeta.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Last changed {getTimeSinceChange()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>{postureHistory.length} total changes</span>
                </div>
              </div>

              {onChangePosture && (
                <Button
                  onClick={onChangePosture}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Change Posture
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Divergence Alert */}
      {hasDivergence && suggestion && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">
                  Posture Divergence Detected
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  You declared <strong>{currentMeta.label}</strong>, but our analysis suggests{' '}
                  <strong>{POSTURE_META[suggestion.suggestedPosture].label}</strong> might be a better fit 
                  based on recent patterns.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReasoningDetails(!showReasoningDetails)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Info className="h-4 w-4 mr-2" />
                  {showReasoningDetails ? 'Hide' : 'Show'} Reasoning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestion (when no divergence) */}
      {!hasDivergence && suggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Your declared posture <strong>{currentMeta.label}</strong> aligns with recent patterns. 
              Confidence: {Math.round(suggestion.confidence * 100)}%
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReasoningDetails(!showReasoningDetails)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showReasoningDetails ? 'Hide' : 'Show'} Reasoning
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reasoning Details */}
      {showReasoningDetails && suggestion && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base">Why This Suggestion?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-purple-900 mb-2">AI Reasoning</h4>
              <p className="text-sm text-purple-800">{suggestion.reasoning}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-purple-900 mb-2">Factors Considered</h4>
              <ul className="space-y-1">
                {suggestion.factorsConsidered.map((factor, index) => (
                  <li key={index} className="text-sm text-purple-800 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-purple-200">
              <p className="text-xs text-purple-700 italic">
                <strong>Remember:</strong> This is data, not a directive. You know yourself best. 
                Posture suggestions help optimize Finder, but you're always in control.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posture History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Recent History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postureHistory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No posture history yet. Declare your first posture to start tracking.
            </p>
          ) : (
            <div className="space-y-3">
              {postureHistory.slice(0, 7).map((entry, index) => {
                const meta = POSTURE_META[entry.posture];
                const Icon = meta.icon;
                const date = new Date(entry.date);
                const isCurrent = index === 0;

                return (
                  <div
                    key={entry.declaredAt}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      isCurrent ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`${meta.bgColor} p-2 rounded-full`}>
                      <Icon className={`h-5 w-5 ${meta.color}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{meta.label}</span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Duration */}
                    {!isCurrent && index < postureHistory.length - 1 && (
                      <div className="text-xs text-gray-500">
                        {calculateDuration(entry.declaredAt, postureHistory[index - 1]?.declaredAt || new Date().toISOString())}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Constitutional Note */}
      <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
        <strong>Your posture, your control:</strong> Posture declarations help Finder optimize 
        recommendations, but they're never mandatory. You can change your posture anytime, 
        ignore AI suggestions, or turn Finder off completely. This data never leaves your device 
        without explicit consent.
      </div>
    </div>
  );
}

// Helper function to calculate duration between two timestamps
function calculateDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffHours < 1) return 'less than 1h';
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ${diffHours % 24}h`;
}

/**
 * Usage Example:
 * 
 * <PostureDashboard
 *   currentPosture="grounded"
 *   postureHistory={[
 *     {
 *       date: '2024-01-15',
 *       posture: 'grounded',
 *       declaredAt: '2024-01-15T10:00:00Z'
 *     },
 *     {
 *       date: '2024-01-14',
 *       posture: 'open',
 *       declaredAt: '2024-01-14T08:30:00Z'
 *     }
 *   ]}
 *   suggestion={{
 *     suggestedPosture: 'grounded',
 *     confidence: 0.85,
 *     reasoning: 'Your recent reflections show stable engagement with moderate complexity.',
 *     factorsConsidered: [
 *       'Last 3 reflections had balanced tone',
 *       'No tension spikes in past 24 hours',
 *       'TPV shows even distribution across lenses'
 *     ]
 *   }}
 *   onChangePosture={() => console.log('Change posture')}
 * />
 */
