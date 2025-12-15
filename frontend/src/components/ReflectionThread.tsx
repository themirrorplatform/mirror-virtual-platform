import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle, Users, Calendar } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ReflectionCard } from './ReflectionCard';
import { MirrorBackDisplay } from './MirrorBackDisplay';

/**
 * ReflectionThread - Conversation Tree Component
 * 
 * Displays nested reflection conversations with:
 * - Collapse/expand functionality
 * - Thread metadata (participants, depth, reply count)
 * - Visual indentation for reply depth
 * - Lazy loading for deep threads
 * 
 * Constitutional Note: Conversations are the heart of self-reflection.
 * Threading preserves context and shows how understanding evolves.
 */

interface Reply {
  id: string;
  type: 'reflection' | 'mirrorback';
  content: string;
  authorId: string;
  authorUsername: string;
  authorAvatar?: string;
  createdAt: string;
  tone?: 'raw' | 'processing' | 'clear';
  source?: 'ai' | 'human';
  replies?: Reply[];
  replyCount?: number;
}

interface ReflectionThreadProps {
  rootReflection: Reply;
  maxDepth?: number; // Maximum nesting level to show (default: 5)
  onReply?: (parentId: string) => void;
  onLoadMore?: (parentId: string) => void;
  currentUserId?: string;
}

export function ReflectionThread({
  rootReflection,
  maxDepth = 5,
  onReply,
  onLoadMore,
  currentUserId
}: ReflectionThreadProps) {
  return (
    <div className="space-y-4">
      {/* Root Reflection */}
      <ThreadNode
        reply={rootReflection}
        depth={0}
        maxDepth={maxDepth}
        onReply={onReply}
        onLoadMore={onLoadMore}
        currentUserId={currentUserId}
      />
    </div>
  );
}

interface ThreadNodeProps {
  reply: Reply;
  depth: number;
  maxDepth: number;
  onReply?: (parentId: string) => void;
  onLoadMore?: (parentId: string) => void;
  currentUserId?: string;
}

function ThreadNode({
  reply,
  depth,
  maxDepth,
  onReply,
  onLoadMore,
  currentUserId
}: ThreadNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 3); // Auto-collapse after 3 levels
  const hasReplies = reply.replies && reply.replies.length > 0;
  const replyCount = reply.replyCount || reply.replies?.length || 0;
  const canNestDeeper = depth < maxDepth;

  // Calculate unique participants in thread
  const getParticipantCount = (node: Reply): Set<string> => {
    const participants = new Set<string>([node.authorId]);
    if (node.replies) {
      node.replies.forEach(r => {
        const childParticipants = getParticipantCount(r);
        childParticipants.forEach(p => participants.add(p));
      });
    }
    return participants;
  };

  const participantCount = depth === 0 ? getParticipantCount(reply).size : 0;

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}>
      {/* Collapse/Expand Button */}
      {hasReplies && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="text-xs">
            {isExpanded ? 'Collapse' : 'Expand'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
        </Button>
      )}

      {/* Thread Metadata (root only) */}
      {depth === 0 && (
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Thread depth: {getThreadDepth(reply)}</span>
          </div>
        </div>
      )}

      {/* Reply Content */}
      <div className={depth > 0 ? 'mb-4' : ''}>
        {reply.type === 'mirrorback' ? (
          <MirrorBackDisplay
            mirrorbackId={reply.id}
            content={reply.content}
            source={reply.source || 'ai'}
            tone={reply.tone}
            createdAt={reply.createdAt}
            authorUsername={reply.source === 'human' ? reply.authorUsername : undefined}
          />
        ) : (
          <ReflectionCard
            id={reply.id}
            content={reply.content}
            authorId={reply.authorId}
            authorUsername={reply.authorUsername}
            authorAvatar={reply.authorAvatar}
            createdAt={reply.createdAt}
            tone={reply.tone || 'clear'}
            visibility="public"
            isOwner={currentUserId === reply.authorId}
          />
        )}

        {/* Reply Action */}
        {onReply && depth < maxDepth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(reply.id)}
            className="mt-2 text-xs text-purple-600 hover:text-purple-700"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Reply
          </Button>
        )}
      </div>

      {/* Nested Replies */}
      {isExpanded && hasReplies && canNestDeeper && (
        <div className="space-y-4 mt-4">
          {reply.replies!.map((childReply) => (
            <ThreadNode
              key={childReply.id}
              reply={childReply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onLoadMore={onLoadMore}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Max Depth Warning */}
      {isExpanded && hasReplies && !canNestDeeper && (
        <Card className="p-4 bg-amber-50 border-amber-200 mt-4">
          <p className="text-sm text-amber-800">
            Thread continues deeper. Maximum nesting level reached.
          </p>
          {onLoadMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLoadMore(reply.id)}
              className="mt-2"
            >
              View in new thread
            </Button>
          )}
        </Card>
      )}

      {/* Load More (for paginated replies) */}
      {isExpanded && replyCount > (reply.replies?.length || 0) && onLoadMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLoadMore(reply.id)}
          className="mt-4 w-full"
        >
          Load {replyCount - (reply.replies?.length || 0)} more {replyCount - (reply.replies?.length || 0) === 1 ? 'reply' : 'replies'}
        </Button>
      )}
    </div>
  );
}

// Helper function to calculate thread depth
function getThreadDepth(reply: Reply): number {
  if (!reply.replies || reply.replies.length === 0) return 1;
  const childDepths = reply.replies.map(r => getThreadDepth(r));
  return 1 + Math.max(...childDepths);
}

/**
 * Usage Example:
 * 
 * <ReflectionThread
 *   rootReflection={{
 *     id: 'refl_123',
 *     type: 'reflection',
 *     content: 'I feel stuck between wanting to change and fearing what that means.',
 *     authorId: 'user_456',
 *     authorUsername: 'alex',
 *     createdAt: '2024-01-15T10:00:00Z',
 *     tone: 'raw',
 *     replies: [
 *       {
 *         id: 'mb_789',
 *         type: 'mirrorback',
 *         content: 'That fear is data—not a blocker. What does change mean to you?',
 *         authorId: 'system',
 *         authorUsername: 'MirrorX',
 *         createdAt: '2024-01-15T10:05:00Z',
 *         source: 'ai',
 *         tone: 'clear',
 *         replies: []
 *       }
 *     ],
 *     replyCount: 1
 *   }}
 *   maxDepth={5}
 *   onReply={(parentId) => console.log('Reply to:', parentId)}
 *   currentUserId="user_456"
 * />
 */
