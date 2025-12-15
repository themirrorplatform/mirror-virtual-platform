/**
 * Response Composer - Create thoughtful responses to Commons posts
 * 
 * Features:
 * - Quote selection from original post
 * - "What part are you responding to?" prompt
 * - Response preview
 * - Tone selector (question, reflection, challenge, support)
 * - Privacy controls
 * - Constitutional framing (not debate)
 * - Character limit with guidance
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle,
  Quote,
  Eye,
  Send,
  X,
  Info,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResponseComposerProps {
  originalContent: string;
  onSubmit: (response: ResponseData) => void;
  onCancel: () => void;
  authorName?: string;
  isOpen: boolean;
}

interface ResponseData {
  quotedText?: string;
  responseText: string;
  tone: ResponseTone;
  isPublic: boolean;
}

type ResponseTone = 'question' | 'reflection' | 'challenge' | 'support';

const TONE_CONFIG = {
  question: {
    label: 'Question',
    description: 'Asking for clarification or deeper exploration',
    icon: HelpCircle,
    color: '#3B82F6',
    example: '"What led you to this conclusion?"',
  },
  reflection: {
    label: 'Reflection',
    description: 'Sharing your own perspective or experience',
    icon: Lightbulb,
    color: '#8B5CF6',
    example: '"This resonates with something I noticed..."',
  },
  challenge: {
    label: 'Challenge',
    description: 'Respectfully questioning assumptions or logic',
    icon: AlertTriangle,
    color: '#F59E0B',
    example: '"I see a tension between X and Y here"',
  },
  support: {
    label: 'Support',
    description: 'Affirming or building on their thinking',
    icon: Heart,
    color: '#10B981',
    example: '"This helped me see..."',
  },
};

const MAX_RESPONSE_LENGTH = 500;

export function ResponseComposer({
  originalContent,
  onSubmit,
  onCancel,
  authorName = 'Anonymous',
  isOpen,
}: ResponseComposerProps) {
  const [selectedText, setSelectedText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [tone, setTone] = useState<ResponseTone>('reflection');
  const [isPublic, setIsPublic] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const remainingChars = MAX_RESPONSE_LENGTH - responseText.length;
  const canSubmit = responseText.trim().length >= 20 && remainingChars >= 0;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit({
        quotedText: selectedText || undefined,
        responseText: responseText.trim(),
        tone,
        isPublic,
      });
      // Reset form
      setSelectedText('');
      setResponseText('');
      setTone('reflection');
      setIsPublic(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle size={24} className="text-[var(--color-accent-blue)]" />
                <div>
                  <h3 className="mb-1">Compose Response</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Responding to {authorName}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X size={20} />
              </Button>
            </div>

            {/* Original Post */}
            <Card>
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-[var(--color-text-muted)]">
                  Original Post:
                </h5>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {originalContent}
                </p>
              </div>
            </Card>

            {/* Quote Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  What part are you responding to?
                </h4>
                <button
                  onClick={() => setSelectedText('')}
                  className="text-xs text-[var(--color-accent-blue)] hover:underline"
                  disabled={!selectedText}
                >
                  Clear selection
                </button>
              </div>

              <textarea
                value={selectedText}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSelectedText(e.target.value)}
                placeholder="Copy a specific part of the post you're responding to (optional)..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none"
                rows={3}
              />

              {selectedText && (
                <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10 border-l-4 border-[var(--color-accent-blue)]">
                  <div className="flex items-start gap-2">
                    <Quote size={14} className="text-[var(--color-accent-blue)] mt-0.5" />
                    <p className="text-sm text-[var(--color-text-secondary)] italic">
                      {selectedText}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tone Selector */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Choose your tone</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(TONE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = tone === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setTone(key as ResponseTone)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-2 shadow-md'
                          : 'border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-blue)]'
                      }`}
                      style={{
                        borderColor: isSelected ? config.color : undefined,
                        backgroundColor: isSelected ? `${config.color}10` : undefined,
                      }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Icon size={16} style={{ color: config.color }} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">
                        {config.description}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] italic">
                        {config.example}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Response Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Your response</h4>
                <span
                  className={`text-xs ${
                    remainingChars < 50
                      ? 'text-[var(--color-border-error)]'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {remainingChars} characters remaining
                </span>
              </div>

              <textarea
                value={responseText}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResponseText(e.target.value)}
                placeholder="Write your response... (20 characters minimum)"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none"
                rows={6}
                maxLength={MAX_RESPONSE_LENGTH}
              />

              <p className="text-xs text-[var(--color-text-muted)]">
                {responseText.length < 20
                  ? `${20 - responseText.length} more characters needed`
                  : '✓ Minimum length met'}
              </p>
            </div>

            {/* Privacy Toggle */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Visibility</h4>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-[var(--color-surface-hover)]">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPublic(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
                />
                <div>
                  <span className="text-sm font-medium block mb-1">
                    Make this response public
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Others can see this response in the Commons. Uncheck to keep it visible only to the author.
                  </span>
                </div>
              </label>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye size={14} />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>

            {/* Preview */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <Card className="border-2 border-[var(--color-accent-blue)]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">Preview</h5>
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${TONE_CONFIG[tone].color}20`,
                            color: TONE_CONFIG[tone].color,
                          }}
                        >
                          {TONE_CONFIG[tone].label}
                        </Badge>
                      </div>

                      {selectedText && (
                        <div className="p-2 rounded bg-[var(--color-surface-hover)] border-l-4 border-[var(--color-accent-blue)]">
                          <div className="flex items-start gap-2">
                            <Quote size={12} className="text-[var(--color-text-muted)] mt-0.5" />
                            <p className="text-xs text-[var(--color-text-muted)] italic">
                              {selectedText}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {responseText || <em className="text-[var(--color-text-muted)]">Your response will appear here...</em>}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <Badge variant="secondary" size="sm">
                          {isPublic ? 'Public' : 'Private'}
                        </Badge>
                        <span>•</span>
                        <span>Just now</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Constitutional Framing */}
            <Card className="border-2 border-[var(--color-accent-blue)]">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                <div className="text-xs text-[var(--color-text-secondary)]">
                  <p className="mb-2">
                    <strong>Responses are for dialogue, not debate.</strong> The Commons exists 
                    for witnessing and reflection, not winning arguments or changing minds.
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    Your response should add to the conversation, not dominate it. When you 
                    challenge, do so to explore, not to correct.
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>

              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2"
              >
                <Send size={16} />
                Post Response
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export type { ResponseData, ResponseTone };




