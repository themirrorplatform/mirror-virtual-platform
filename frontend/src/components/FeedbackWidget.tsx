import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

/**
 * FeedbackWidget - User Feedback Collection
 * 
 * Features:
 * - Star rating (1-5) for overall experience
 * - Quick feedback buttons (helpful/unhelpful)
 * - Optional comment field
 * - Feedback history display
 * - Submission confirmation
 * 
 * Constitutional Note: Your feedback directly shapes how
 * the system evolves. All feedback is valued and reviewed.
 */

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;
export type QuickFeedback = 'helpful' | 'unhelpful' | 'unclear' | 'too_slow' | 'inaccurate';

interface FeedbackSubmission {
  rating?: FeedbackRating;
  quickFeedback?: QuickFeedback;
  comment?: string;
  contextId?: string; // ID of the thing being rated (reflection, mirrorback, etc.)
  contextType?: string;
}

interface PreviousFeedback {
  id: string;
  rating?: FeedbackRating;
  quickFeedback?: QuickFeedback;
  comment?: string;
  submittedAt: string;
  contextType?: string;
}

interface FeedbackWidgetProps {
  contextId?: string;
  contextType?: 'mirrorback' | 'door' | 'posture_suggestion' | 'bias_insight' | 'general';
  onSubmit: (feedback: FeedbackSubmission) => void;
  showHistory?: boolean;
  previousFeedback?: PreviousFeedback[];
  compact?: boolean;
}

// Quick feedback options
const quickOptions: { value: QuickFeedback; label: string; icon: typeof ThumbsUp }[] = [
  { value: 'helpful', label: 'Helpful', icon: ThumbsUp },
  { value: 'unhelpful', label: 'Unhelpful', icon: ThumbsDown },
  { value: 'unclear', label: 'Unclear', icon: MessageSquare },
  { value: 'too_slow', label: 'Too Slow', icon: TrendingUp },
  { value: 'inaccurate', label: 'Inaccurate', icon: Star }
];

export function FeedbackWidget({
  contextId,
  contextType = 'general',
  onSubmit,
  showHistory = false,
  previousFeedback = [],
  compact = false
}: FeedbackWidgetProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [quickFeedback, setQuickFeedback] = useState<QuickFeedback | null>(null);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!rating && !quickFeedback && !comment.trim()) {
      return; // Need at least one form of feedback
    }

    const submission: FeedbackSubmission = {
      contextId,
      contextType
    };

    if (rating) submission.rating = rating;
    if (quickFeedback) submission.quickFeedback = quickFeedback;
    if (comment.trim()) submission.comment = comment.trim();

    onSubmit(submission);
    setSubmitted(true);

    // Reset form after 2 seconds
    setTimeout(() => {
      setRating(null);
      setQuickFeedback(null);
      setComment('');
      setSubmitted(false);
    }, 2000);
  };

  const canSubmit = rating !== null || quickFeedback !== null || comment.trim().length > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => {
                setRating(star as FeedbackRating);
                onSubmit({
                  rating: star as FeedbackRating,
                  contextId,
                  contextType
                });
              }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="transition-colors"
            >
              <Star
                className={`h-4 w-4 ${
                  star <= (hoveredRating || rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">Rate this</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Provide Feedback
          </CardTitle>
          <p className="text-sm text-gray-500">
            Help us improve based on your experience
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <ThumbsUp className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Thank You!
              </h3>
              <p className="text-sm text-gray-600">
                Your feedback helps the system evolve
              </p>
            </div>
          ) : (
            <>
              {/* Star Rating */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star as FeedbackRating)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {rating && (
                    <span className="ml-2 text-sm text-gray-600">
                      {rating} / 5
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Feedback */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quick Feedback (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = quickFeedback === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setQuickFeedback(isSelected ? null : option.value)
                        }
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label
                  htmlFor="feedback-comment"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Additional Comments (Optional)
                </label>
                <textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setComment(e.target.value)}
                  placeholder="Share more details about your experience..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  rows={4}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {comment.length} / 500
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                Submit Feedback
              </Button>

              {/* Encouragement */}
              <p className="text-xs text-gray-500 text-center italic">
                Your feedback directly shapes how the system evolves
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feedback History */}
      {showHistory && previousFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous Feedback</CardTitle>
            <p className="text-sm text-gray-500">
              Your recent feedback submissions
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previousFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {feedback.rating && (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= feedback.rating!
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {feedback.quickFeedback && (
                        <Badge variant="outline" className="text-xs">
                          {feedback.quickFeedback.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(feedback.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-700">{feedback.comment}</p>
                  )}
                  {feedback.contextType && (
                    <Badge variant="outline" className="text-xs mt-2">
                      {feedback.contextType.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              ))}
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
 * // Full widget
 * <FeedbackWidget
 *   contextId="mirrorback_123"
 *   contextType="mirrorback"
 *   onSubmit={(feedback) => console.log('Feedback:', feedback)}
 *   showHistory={true}
 *   previousFeedback={[
 *     {
 *       id: 'fb_1',
 *       rating: 5,
 *       quickFeedback: 'helpful',
 *       comment: 'This insight was really helpful',
 *       submittedAt: '2024-01-15T10:00:00Z',
 *       contextType: 'mirrorback'
 *     }
 *   ]}
 * />
 * 
 * // Compact inline version
 * <FeedbackWidget
 *   contextId="door_456"
 *   contextType="door"
 *   onSubmit={(feedback) => console.log('Quick rating:', feedback)}
 *   compact={true}
 * />
 */

