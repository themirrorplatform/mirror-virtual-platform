/**
 * Collaboration Tools - Constitutional collaboration features
 * 
 * Features:
 * - Witness/Respond (not Like/Share)
 * - Reflection threads
 * - Consent-based visibility
 * - No follower counts
 * - No metrics or engagement tracking
 * - Witnessing without domination
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  MessageCircle, 
  Share2, 
  Users,
  Lock,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface CollaborationPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  visibility: 'private' | 'commons' | 'select';
  witnessed: boolean;
  responseCount: number;
  canRespond: boolean;
}

interface WitnessAction {
  postId: string;
  timestamp: Date;
}

interface Response {
  id: string;
  postId: string;
  author: {
    id: string;
    name: string;
  };
  content: string;
  timestamp: Date;
  responseType: 'reflection' | 'question' | 'resonance';
}

/**
 * Witness Button - Not a "like", a witnessing
 */
interface WitnessButtonProps {
  postId: string;
  witnessed: boolean;
  onWitness: (postId: string) => void;
  disabled?: boolean;
}

export function WitnessButton({ 
  postId, 
  witnessed, 
  onWitness, 
  disabled = false 
}: WitnessButtonProps) {
  return (
    <button
      onClick={() => onWitness(postId)}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
        witnessed
          ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'
          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-blue)]/10'
      }`}
    >
      <Eye size={16} />
      <span className="text-sm">
        {witnessed ? 'Witnessed' : 'Witness'}
      </span>
    </button>
  );
}

/**
 * Response Composer - Thoughtful response interface
 */
interface ResponseComposerProps {
  postId: string;
  postExcerpt?: string;
  onSubmit: (response: Omit<Response, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
}

export function ResponseComposer({ 
  postId, 
  postExcerpt, 
  onSubmit, 
  onCancel 
}: ResponseComposerProps) {
  const [content, setContent] = useState('');
  const [responseType, setResponseType] = useState<Response['responseType']>('reflection');
  const [selectedText, setSelectedText] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;

    onSubmit({
      postId,
      author: {
        id: 'current-user',
        name: 'You',
      },
      content,
      responseType,
    });

    setContent('');
    setSelectedText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <Card>
        <div className="space-y-4">
          {/* Context */}
          {postExcerpt && (
            <div className="p-3 rounded-lg bg-[var(--color-surface-hover)] border-l-4 border-[var(--color-accent-blue)]">
              <p className="text-sm text-[var(--color-text-secondary)] italic">
                "{postExcerpt}"
              </p>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">
              What part are you responding to?
            </label>
            <textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Quote the specific part..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Response Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">
              Response type
            </label>
            <div className="flex gap-2">
              {(['reflection', 'question', 'resonance'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setResponseType(type)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    responseType === type
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Response Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">
              Your response
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] resize-none"
              rows={4}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!content.trim()}>
              Respond
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Visibility Selector - Consent-based sharing
 */
interface VisibilitySelectorProps {
  value: CollaborationPost['visibility'];
  onChange: (visibility: CollaborationPost['visibility']) => void;
  disabled?: boolean;
}

export function VisibilitySelector({ 
  value, 
  onChange, 
  disabled = false 
}: VisibilitySelectorProps) {
  const options = [
    {
      value: 'private' as const,
      icon: Lock,
      label: 'Private',
      description: 'Only you can see this',
    },
    {
      value: 'commons' as const,
      icon: Globe,
      label: 'Commons',
      description: 'Visible to all in the Commons',
    },
    {
      value: 'select' as const,
      icon: Users,
      label: 'Select',
      description: 'Choose who can see this',
    },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Visibility</label>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
              value === option.value
                ? 'bg-[var(--color-accent-blue)]/10 border-2 border-[var(--color-accent-blue)]'
                : 'bg-[var(--color-surface-hover)] border-2 border-transparent hover:border-[var(--color-border-subtle)]'
            }`}
          >
            <option.icon 
              size={20} 
              className={value === option.value ? 'text-[var(--color-accent-blue)]' : 'text-[var(--color-text-muted)]'}
            />
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{option.label}</span>
                {value === option.value && (
                  <CheckCircle size={14} className="text-[var(--color-accent-blue)]" />
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Response Thread - Show responses to a post
 */
interface ResponseThreadProps {
  responses: Response[];
  onReply?: (responseId: string) => void;
  showAll?: boolean;
}

export function ResponseThread({ 
  responses, 
  onReply,
  showAll = false 
}: ResponseThreadProps) {
  const [expanded, setExpanded] = useState(showAll);
  const displayResponses = expanded ? responses : responses.slice(0, 3);

  if (responses.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
        No responses yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayResponses.map((response) => (
        <ResponseCard 
          key={response.id} 
          response={response} 
          onReply={onReply}
        />
      ))}

      {!expanded && responses.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-sm text-[var(--color-accent-blue)] hover:underline py-2"
        >
          Show {responses.length - 3} more responses
        </button>
      )}
    </div>
  );
}

/**
 * Response Card - Individual response display
 */
function ResponseCard({ 
  response, 
  onReply 
}: { 
  response: Response; 
  onReply?: (responseId: string) => void;
}) {
  const typeConfig = {
    reflection: { color: 'text-[var(--color-accent-blue)]', label: 'Reflection' },
    question: { color: 'text-[var(--color-accent-purple)]', label: 'Question' },
    resonance: { color: 'text-[var(--color-accent-green)]', label: 'Resonance' },
  };

  const config = typeConfig[response.responseType];

  return (
    <Card variant="emphasis">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue)]/10 flex items-center justify-center">
              <span className="text-xs font-medium">
                {response.author.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{response.author.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {formatTimestamp(response.timestamp)}
              </p>
            </div>
          </div>
          <Badge variant="default" className={config.color}>
            {config.label}
          </Badge>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          {response.content}
        </p>

        {onReply && (
          <button
            onClick={() => onReply(response.id)}
            className="text-xs text-[var(--color-accent-blue)] hover:underline"
          >
            Respond
          </button>
        )}
      </div>
    </Card>
  );
}

/**
 * Collaboration Status - Show collaboration state
 */
interface CollaborationStatusProps {
  witnessed: boolean;
  responseCount: number;
  visibility: CollaborationPost['visibility'];
  canEdit?: boolean;
  onChangeVisibility?: () => void;
}

export function CollaborationStatus({
  witnessed,
  responseCount,
  visibility,
  canEdit = false,
  onChangeVisibility,
}: CollaborationStatusProps) {
  const visibilityConfig = {
    private: { icon: Lock, label: 'Private', color: 'text-[var(--color-text-muted)]' },
    commons: { icon: Globe, label: 'Commons', color: 'text-[var(--color-accent-blue)]' },
    select: { icon: Users, label: 'Select', color: 'text-[var(--color-accent-purple)]' },
  };

  const config = visibilityConfig[visibility];

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        <Eye size={14} />
        <span>{witnessed ? 'Witnessed' : 'Not witnessed'}</span>
      </div>

      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        <MessageCircle size={14} />
        <span>{responseCount} {responseCount === 1 ? 'response' : 'responses'}</span>
      </div>

      <button
        onClick={onChangeVisibility}
        disabled={!canEdit}
        className={`flex items-center gap-1.5 ${config.color} ${
          canEdit ? 'hover:underline' : ''
        }`}
      >
        <config.icon size={14} />
        <span>{config.label}</span>
      </button>
    </div>
  );
}

/**
 * Consent Banner - Remind about data sovereignty
 */
export function CollaborationConsentBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-accent-blue)]/10 border-l-4 border-[var(--color-accent-blue)] p-4 rounded-lg"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium mb-1">About Witnessing</h4>
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
            Witnessing means you've seen and acknowledged someone's reflection. 
            It's not about agreement or endorsement—it's about presence.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            You control what you share. Nothing leaves your control without consent.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * useCollaboration Hook - Manage collaboration state
 */
export function useCollaboration() {
  const [witnessed, setWitnessed] = useState<Set<string>>(new Set());
  const [responses, setResponses] = useState<Response[]>([]);

  const witness = (postId: string) => {
    setWitnessed(prev => new Set([...prev, postId]));
  };

  const unwitness = (postId: string) => {
    setWitnessed(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  const addResponse = (response: Omit<Response, 'id' | 'timestamp'>) => {
    const newResponse: Response = {
      ...response,
      id: `response-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setResponses(prev => [...prev, newResponse]);
  };

  const getResponses = (postId: string) => {
    return responses.filter(r => r.postId === postId);
  };

  return {
    witnessed,
    witness,
    unwitness,
    responses,
    addResponse,
    getResponses,
  };
}

export type { 
  CollaborationPost, 
  WitnessAction, 
  Response,
  WitnessButtonProps,
  ResponseComposerProps,
  VisibilitySelectorProps 
};
