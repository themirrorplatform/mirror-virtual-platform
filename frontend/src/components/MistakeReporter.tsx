/**
 * MistakeReporter Component
 * Allows users to report Finder delivery mistakes
 */

import React, { useState } from 'react';
import { useReportMistake } from '@/lib/hooks/useFinder';
import { MistakeType } from '@/lib/api/finder';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MistakeReporterProps {
  nodeId: string;
  doorTitle?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// MISTAKE TYPES CONFIG
// ────────────────────────────────────────────────────────────────────────────

const MISTAKE_TYPES: Array<{
  value: MistakeType;
  label: string;
  description: string;
}> = [
  {
    value: 'consent_violation',
    label: 'Consent Violation',
    description: 'Door appeared without adequate context or warning',
  },
  {
    value: 'timing_mismatch',
    label: 'Timing Mismatch',
    description: "Wrong timing — didn't match my current posture/capacity",
  },
  {
    value: 'corruption_risk',
    label: 'Corruption Risk',
    description: 'Feels like it could undermine my reflection practice',
  },
  {
    value: 'bandwidth_overload',
    label: 'Bandwidth Overload',
    description: 'Too intense/complex for my current bandwidth',
  },
  {
    value: 'discomfort',
    label: 'General Discomfort',
    description: 'Something feels off but I can\'t articulate why',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export function MistakeReporter({ nodeId, doorTitle, onClose, onSuccess }: MistakeReporterProps) {
  const [selectedType, setSelectedType] = useState<MistakeType | null>(null);
  const [context, setContext] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reportMistake = useReportMistake();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) return;

    try {
      await reportMistake.mutateAsync({
        nodeId,
        mistakeType: selectedType,
        context: context.trim() || undefined,
      });

      setSubmitted(true);

      // Auto-close after success
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to report mistake:', error);
    }
  };

  // Success State
  if (submitted) {
    return (
      <div className="w-full max-w-lg p-8 bg-white rounded-lg border border-gray-200 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Thank you for teaching us
          </h2>
          <p className="text-gray-600 mb-6">
            Your feedback helps Mirror Finder learn and improve. We'll use this to avoid similar mistakes.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div className="w-full max-w-2xl bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Report a Mistake
            </h2>
            <p className="text-sm text-gray-600">
              Help us learn: what went wrong with this door?
            </p>
            {doorTitle && (
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Door: {doorTitle}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Mistake Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            What kind of mistake was this? *
          </label>
          <div className="space-y-2">
            {MISTAKE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  selectedType === type.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        selectedType === type.value
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                      )}
                    >
                      {selectedType === type.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Context Field */}
        <div>
          <label htmlFor="context" className="block text-sm font-semibold text-gray-900 mb-2">
            Additional context (optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContext(e.target.value)}
            rows={4}
            placeholder="Help us understand what happened. This is delivery feedback, not content critique."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">
            Be as specific as you can — it helps us learn faster.
          </p>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">This is about delivery, not content</p>
              <p className="text-blue-700">
                We're not judging the door itself — we're learning if we showed it at the wrong time, in the wrong way, or to the wrong person. Thank you for helping us improve.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!selectedType || reportMistake.isPending}
            className="flex-1 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reportMistake.isPending ? 'Submitting...' : 'Submit Report'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Error Display */}
        {reportMistake.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900">
              Failed to submit report. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

