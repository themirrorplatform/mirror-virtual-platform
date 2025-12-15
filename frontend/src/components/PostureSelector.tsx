/**
 * PostureSelector Component
 * Allows users to declare their current reflective posture
 */

import React from 'react';
import { usePosture, useUpdatePosture } from '@/lib/hooks/useFinder';
import { Posture } from '@/lib/api/finder';
import { AlertCircle, HelpCircle, Lightbulb, Shield, Smile, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// POSTURE CONFIG
// ────────────────────────────────────────────────────────────────────────────

const POSTURES: Array<{
  value: Posture;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = [
  {
    value: 'unknown',
    label: 'Unknown',
    icon: HelpCircle,
    color: 'text-gray-500 bg-gray-100 hover:bg-gray-200',
    description: "I'm not sure where I am right now",
  },
  {
    value: 'overwhelmed',
    label: 'Overwhelmed',
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50 hover:bg-red-100',
    description: 'Too much to process, need simplicity',
  },
  {
    value: 'guarded',
    label: 'Guarded',
    icon: Shield,
    color: 'text-amber-600 bg-amber-50 hover:bg-amber-100',
    description: 'Cautious, protective of my space',
  },
  {
    value: 'grounded',
    label: 'Grounded',
    icon: Smile,
    color: 'text-green-600 bg-green-50 hover:bg-green-100',
    description: 'Stable, ready for depth',
  },
  {
    value: 'open',
    label: 'Open',
    icon: Lightbulb,
    color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    description: 'Curious, receptive to new perspectives',
  },
  {
    value: 'exploratory',
    label: 'Exploratory',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
    description: 'Seeking novelty and challenge',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export function PostureSelector() {
  const { data: postureState, isLoading } = usePosture();
  const updatePosture = useUpdatePosture();

  const handlePostureChange = (posture: Posture) => {
    updatePosture.mutate(posture);
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPosture = postureState?.declared || 'unknown';
  const suggestedPosture = postureState?.suggested;
  const hasDivergence = suggestedPosture && suggestedPosture !== currentPosture;

  return (
    <div className="w-full p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          How are you showing up?
        </h2>
        <p className="text-sm text-gray-600">
          Your posture affects what doors appear and how they're presented.
        </p>
      </div>

      {/* Divergence Alert */}
      {hasDivergence && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">
                Suggested posture differs from declared
              </p>
              <p className="text-amber-700 mt-1">
                Based on recent patterns, we suggest:{' '}
                <span className="font-semibold">
                  {POSTURES.find((p) => p.value === suggestedPosture)?.label}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Posture Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {POSTURES.map((posture) => {
          const Icon = posture.icon;
          const isSelected = currentPosture === posture.value;
          const isSuggested = suggestedPosture === posture.value;

          return (
            <button
              key={posture.value}
              onClick={() => handlePostureChange(posture.value)}
              disabled={updatePosture.isPending}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all',
                'flex flex-col items-center text-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'border-gray-900 bg-gray-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300',
                posture.color
              )}
            >
              {/* Suggested Badge */}
              {isSuggested && !isSelected && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Suggested
                </div>
              )}

              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Current
                </div>
              )}

              <Icon className="w-8 h-8" />
              <span className="font-semibold text-sm">{posture.label}</span>
              <span className="text-xs opacity-75 leading-tight">
                {posture.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>Your declared posture is canonical.</strong> The suggested posture is
          advisory only. Mirror Finder will respect your declaration even if it differs from
          the suggestion.
        </p>
      </div>
    </div>
  );
}
