import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { 
  Scale, 
  GitBranch, 
  MessageSquare, 
  ThumbsUp, 
  AlertTriangle, 
  CheckCircle,
  Users,
  FileText,
  Clock
} from 'lucide-react';

type ActivityType = 
  | 'amendment_proposed' 
  | 'amendment_passed' 
  | 'amendment_rejected'
  | 'fork_created'
  | 'vote_cast'
  | 'discussion_started'
  | 'quorum_reached';

interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  actor: string;
  title: string;
  description: string;
  metadata?: {
    amendmentId?: string;
    votes?: { for: number; against: number };
    category?: string;
  };
}

const mockActivities: Activity[] = [
  {
    id: 'act-1',
    type: 'quorum_reached',
    timestamp: '2 hours ago',
    actor: 'The Commons',
    title: 'Quorum Reached: Pattern Privacy Amendment',
    description: 'Amendment AMD-002 has reached the required participation threshold of 500 votes.',
    metadata: {
      amendmentId: 'AMD-002',
      votes: { for: 428, against: 156 },
      category: 'privacy',
    },
  },
  {
    id: 'act-2',
    type: 'amendment_proposed',
    timestamp: '5 hours ago',
    actor: 'Commons Member #9203',
    title: 'New Proposal: Multimodal Privacy Controls',
    description: 'Proposed amendment to add explicit privacy controls for voice and video reflections, including on-device transcription requirements.',
    metadata: {
      amendmentId: 'AMD-004',
      category: 'privacy',
    },
  },
  {
    id: 'act-3',
    type: 'discussion_started',
    timestamp: '8 hours ago',
    actor: 'Commons Member #4721',
    title: 'Discussion: Should The Mirror Detect Urgent Safety Needs?',
    description: 'Community debate on whether constitutional boundaries should allow crisis detection vs. remaining purely reflective.',
    metadata: {
      amendmentId: 'AMD-001',
    },
  },
  {
    id: 'act-4',
    type: 'amendment_passed',
    timestamp: '1 day ago',
    actor: 'The Commons',
    title: 'Amendment Ratified: Model Integrity Verification',
    description: 'AMD-003 passed with 91% support. Cryptographic verification now required for all AI model deployments.',
    metadata: {
      amendmentId: 'AMD-003',
      votes: { for: 712, against: 43 },
      category: 'engine',
    },
  },
  {
    id: 'act-5',
    type: 'fork_created',
    timestamp: '2 days ago',
    actor: 'Commons Member #1203',
    title: 'New Fork: Privacy Strict Mode',
    description: 'Created constitutional fork with stricter privacy defaults, including session-level consent requirements.',
  },
  {
    id: 'act-6',
    type: 'vote_cast',
    timestamp: '2 days ago',
    actor: 'Commons Member #5621',
    title: 'High-Profile Vote on Crisis Support',
    description: 'Community advocate cast deciding vote on AMD-001, pushing participation to 89% of quorum.',
    metadata: {
      amendmentId: 'AMD-001',
    },
  },
];

export function GovernanceActivityFeed() {
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');

  const filteredActivities = filter === 'all' 
    ? mockActivities 
    : mockActivities.filter(a => a.type === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl mb-3">Commons Activity</h3>
        <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
          What's happening in collective governance
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
            filter === 'all'
              ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
          }`}
        >
          All activity
        </button>
        <button
          onClick={() => setFilter('amendment_proposed')}
          className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
            filter === 'amendment_proposed'
              ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
          }`}
        >
          Proposals
        </button>
        <button
          onClick={() => setFilter('vote_cast')}
          className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
            filter === 'vote_cast'
              ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
          }`}
        >
          Votes
        </button>
        <button
          onClick={() => setFilter('discussion_started')}
          className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
            filter === 'discussion_started'
              ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
          }`}
        >
          Discussions
        </button>
      </div>

      {/* Activity feed */}
      <div className="space-y-4">{filteredActivities.map((activity) => {
        const getActivityIcon = (type: ActivityType) => {
          switch (type) {
            case 'amendment_proposed':
              return <FileText size={20} className="text-[var(--color-accent-blue)]" />;
            case 'amendment_passed':
              return <CheckCircle size={20} className="text-[var(--color-accent-green)]" />;
            case 'amendment_rejected':
              return <AlertTriangle size={20} className="text-[var(--color-accent-red)]" />;
            case 'fork_created':
              return <GitBranch size={20} className="text-[var(--color-accent-purple)]" />;
            case 'vote_cast':
              return <ThumbsUp size={20} className="text-[var(--color-accent-gold)]" />;
            case 'discussion_started':
              return <MessageSquare size={20} className="text-[var(--color-accent-blue)]" />;
            case 'quorum_reached':
              return <Users size={20} className="text-[var(--color-accent-green)]" />;
          }
        };

        const getCategoryBadge = (category?: string) => {
          if (!category) return null;
          
          const colors = {
            boundary: 'text-[var(--color-accent-purple)] bg-[var(--color-accent-purple)]/10',
            engine: 'text-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10',
            privacy: 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10',
            refusal: 'text-[var(--color-accent-red)] bg-[var(--color-accent-red)]/10',
          };

          return (
            <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide ${colors[category as keyof typeof colors]}`}>
              {category}
            </span>
          );
        };

        return (
          <Card key={activity.id} className="relative">
            {/* Timeline connector */}
            {filteredActivities.indexOf(activity) !== filteredActivities.length - 1 && (
              <div className="absolute left-[28px] top-[52px] w-0.5 h-[calc(100%+16px)] bg-[var(--color-border-subtle)]" />
            )}

            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center relative z-10">
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm">{activity.title}</h4>
                    {activity.metadata?.category && getCategoryBadge(activity.metadata.category)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                    <Clock size={12} />
                    {activity.timestamp}
                  </div>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  {activity.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span>{activity.actor}</span>
                  {activity.metadata?.amendmentId && (
                    <>
                      <span>•</span>
                      <span>{activity.metadata.amendmentId}</span>
                    </>
                  )}
                  {activity.metadata?.votes && (
                    <>
                      <span>•</span>
                      <span className="text-[var(--color-accent-green)]">
                        {activity.metadata.votes.for} for
                      </span>
                      <span className="text-[var(--color-accent-red)]">
                        {activity.metadata.votes.against} against
                      </span>
                    </>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  {(activity.type === 'amendment_proposed' || activity.type === 'quorum_reached') && (
                    <Button variant="ghost" size="sm">
                      View Proposal
                    </Button>
                  )}
                  {activity.type === 'discussion_started' && (
                    <Button variant="ghost" size="sm">
                      Join Discussion
                    </Button>
                  )}
                  {activity.type === 'fork_created' && (
                    <Button variant="ghost" size="sm">
                      Compare Changes
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}</div>

      {/* Load More */}
      <div className="flex justify-center mt-6">
        <Button variant="ghost">
          Load Earlier Activity
        </Button>
      </div>
    </div>
  );
}