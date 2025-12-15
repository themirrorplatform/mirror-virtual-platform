import React, { useState } from 'react';
import { AlertTriangle, Brain, Lightbulb, TrendingUp, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

/**
 * BiasInsightCard - Bias Analysis Display
 * 
 * Features:
 * - Bias type identification (cognitive, emotional, social)
 * - Severity indicator (low, medium, high)
 * - Context where bias was detected
 * - Correction suggestions from AI
 * - Historical pattern tracking
 * - Dismissal with reason tracking
 * 
 * Constitutional Note: Bias detection is probabilistic analysis,
 * not absolute truth. Use these insights to reflect, not to judge yourself.
 */

export type BiasType =
  | 'confirmation_bias'
  | 'availability_bias'
  | 'anchoring_bias'
  | 'attribution_bias'
  | 'recency_bias'
  | 'negativity_bias'
  | 'optimism_bias'
  | 'sunk_cost_fallacy'
  | 'groupthink'
  | 'dunning_kruger';

export type BiasCategory = 'cognitive' | 'emotional' | 'social';
export type BiasSeverity = 'low' | 'medium' | 'high';

interface BiasPattern {
  firstDetected: string;
  occurrences: number;
  lastOccurrence: string;
}

interface CorrectionSuggestion {
  strategy: string;
  description: string;
  example?: string;
}

interface BiasInsight {
  id: string;
  type: BiasType;
  category: BiasCategory;
  severity: BiasSeverity;
  context: string;
  detectedIn: string; // What reflection/interaction
  detectedAt: string;
  explanation: string;
  correctionSuggestions: CorrectionSuggestion[];
  pattern?: BiasPattern;
  confidence: number; // 0-1
}

interface BiasInsightCardProps {
  bias: BiasInsight;
  onDismiss?: (biasId: string, reason: string) => void;
  onLearnMore?: (biasType: BiasType) => void;
}

// Bias metadata
const BIAS_META: Record<BiasType, { label: string; category: BiasCategory; description: string }> = {
  confirmation_bias: {
    label: 'Confirmation Bias',
    category: 'cognitive',
    description: 'Seeking information that confirms existing beliefs'
  },
  availability_bias: {
    label: 'Availability Bias',
    category: 'cognitive',
    description: 'Overweighting recent or easily recalled information'
  },
  anchoring_bias: {
    label: 'Anchoring Bias',
    category: 'cognitive',
    description: 'Over-relying on the first piece of information encountered'
  },
  attribution_bias: {
    label: 'Attribution Bias',
    category: 'cognitive',
    description: 'Attributing outcomes to internal vs external causes inconsistently'
  },
  recency_bias: {
    label: 'Recency Bias',
    category: 'cognitive',
    description: 'Giving more weight to recent events than earlier ones'
  },
  negativity_bias: {
    label: 'Negativity Bias',
    category: 'emotional',
    description: 'Focusing more on negative information than positive'
  },
  optimism_bias: {
    label: 'Optimism Bias',
    category: 'emotional',
    description: 'Overestimating positive outcomes and underestimating risks'
  },
  sunk_cost_fallacy: {
    label: 'Sunk Cost Fallacy',
    category: 'cognitive',
    description: 'Continuing investment based on past costs rather than future value'
  },
  groupthink: {
    label: 'Groupthink',
    category: 'social',
    description: 'Conforming to group consensus without critical evaluation'
  },
  dunning_kruger: {
    label: 'Dunning-Kruger Effect',
    category: 'cognitive',
    description: 'Overestimating competence in areas of low expertise'
  }
};

// Category colors
const categoryColors = {
  cognitive: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
  emotional: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
  social: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-500' }
};

// Severity colors
const severityStyles = {
  low: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-700' },
  high: { bg: 'bg-red-100', text: 'text-red-700' }
};

export function BiasInsightCard({
  bias,
  onDismiss,
  onLearnMore
}: BiasInsightCardProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPattern, setShowPattern] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const meta = BIAS_META[bias.type];
  const categoryColor = categoryColors[bias.category];
  const severityStyle = severityStyles[bias.severity];

  const handleDismiss = () => {
    if (dismissReason.trim() && onDismiss) {
      onDismiss(bias.id, dismissReason.trim());
      setDismissing(false);
      setDismissReason('');
    }
  };

  return (
    <Card className={`border-l-4 ${categoryColor.border}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className={`h-5 w-5 ${categoryColor.text}`} />
              <CardTitle className="text-lg">{meta.label}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${categoryColor.bg} ${categoryColor.text} border-0`}>
                {bias.category}
              </Badge>
              <Badge className={`${severityStyle.bg} ${severityStyle.text} border-0`}>
                {bias.severity} severity
              </Badge>
              <Badge variant="outline" className="text-xs">
                {(bias.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
          </div>
          {onDismiss && !dismissing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissing(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dismiss Interface */}
        {dismissing && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <p className="text-sm font-medium text-gray-900">Why dismiss this insight?</p>
            <textarea
              value={dismissReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDismissReason(e.target.value)}
              placeholder="Optional: Why do you think this isn't relevant?"
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                disabled={dismissReason.trim().length === 0}
              >
                Dismiss
              </Button>
              <Button
                onClick={() => {
                  setDismissing(false);
                  setDismissReason('');
                }}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Your feedback helps improve bias detection accuracy
            </p>
          </div>
        )}

        {/* Context */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Detected Context</h4>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">{bias.context}</p>
            <p className="text-xs text-gray-500">
              In: {bias.detectedIn} • {new Date(bias.detectedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Why This Might Be a Bias</h4>
          <p className="text-sm text-gray-700">{bias.explanation}</p>
        </div>

        {/* Correction Suggestions */}
        {bias.correctionSuggestions.length > 0 && (
          <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Correction Strategies ({bias.correctionSuggestions.length})
                </div>
                {showSuggestions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {bias.correctionSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <p className="font-medium text-blue-900 text-sm mb-1">
                    {suggestion.strategy}
                  </p>
                  <p className="text-sm text-blue-800">{suggestion.description}</p>
                  {suggestion.example && (
                    <p className="text-xs text-blue-700 mt-2 italic">
                      Example: {suggestion.example}
                    </p>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Historical Pattern */}
        {bias.pattern && (
          <Collapsible open={showPattern} onOpenChange={setShowPattern}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Pattern History
                </div>
                {showPattern ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-amber-700 mb-1">First Detected</p>
                    <p className="font-medium text-amber-900">
                      {new Date(bias.pattern.firstDetected).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 mb-1">Occurrences</p>
                    <p className="font-medium text-amber-900">{bias.pattern.occurrences}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 mb-1">Last Seen</p>
                    <p className="font-medium text-amber-900">
                      {new Date(bias.pattern.lastOccurrence).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 pt-2 border-t border-amber-300">
                  This bias pattern has appeared {bias.pattern.occurrences} times over{' '}
                  {Math.floor(
                    (new Date(bias.pattern.lastOccurrence).getTime() -
                      new Date(bias.pattern.firstDetected).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Learn More */}
        {onLearnMore && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">What is {meta.label}?</p>
                <p className="text-xs text-gray-600">{meta.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLearnMore(bias.type)}
                className="ml-4"
              >
                Learn More
              </Button>
            </div>
          </div>
        )}

        {/* Constitutional Note */}
        <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
          <strong>Bias detection is probabilistic:</strong> This insight is based on pattern 
          analysis, not certainty. Use it as a prompt for reflection, not as a judgment. 
          You're the expert on your own thinking.
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * <BiasInsightCard
 *   bias={{
 *     id: 'bias_123',
 *     type: 'confirmation_bias',
 *     category: 'cognitive',
 *     severity: 'medium',
 *     context: 'In your reflection about the team meeting, you focused on examples that supported your initial opinion while not mentioning counterarguments that were raised.',
 *     detectedIn: 'Reflection: Team Meeting Debrief',
 *     detectedAt: '2024-01-15T10:00:00Z',
 *     explanation: 'The reflection emphasized points that aligned with your pre-existing view that the project timeline was unrealistic, but didn\'t engage with the manager\'s data showing similar projects completed on time.',
 *     correctionSuggestions: [
 *       {
 *         strategy: 'Seek disconfirming evidence',
 *         description: 'Actively look for information that challenges your view',
 *         example: 'Ask yourself: What evidence would change my mind?'
 *       },
 *       {
 *         strategy: 'Devil\'s advocate',
 *         description: 'Argue the opposite position to test your reasoning',
 *         example: 'What would someone who disagrees with me say?'
 *       }
 *     ],
 *     pattern: {
 *       firstDetected: '2024-01-01T00:00:00Z',
 *       occurrences: 5,
 *       lastOccurrence: '2024-01-15T10:00:00Z'
 *     },
 *     confidence: 0.75
 *   }}
 *   onDismiss={(id, reason) => console.log('Dismissed:', id, reason)}
 *   onLearnMore={(type) => console.log('Learn more:', type)}
 * />
 */

