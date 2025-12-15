import { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { 
  Shield, 
  Eye, 
  TrendingUp, 
  Zap, 
  Target, 
  Brain,
  Lock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface BoundaryCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
}

export function BoundariesScreen() {
  const [acknowledgedSections, setAcknowledgedSections] = useState<Set<string>>(new Set());
  const [hasAcknowledgedAll, setHasAcknowledgedAll] = useState(false);

  const boundaries: BoundaryCategory[] = [
    {
      title: 'What The Mirror Is',
      icon: <Eye size={20} />,
      color: 'text-[var(--color-accent-gold)]',
      items: [
        'A reflective surface for your own thinking',
        'A tool for noticing patterns in how you experience yourself',
        'A space to externalize internal contradictions',
        'Local-first software you control',
        'A constitutional system with transparent constraints',
      ],
    },
    {
      title: 'What The Mirror Is Not',
      icon: <Shield size={20} />,
      color: 'text-[var(--color-accent-red)]',
      items: [
        'Not a therapist, counselor, or mental health professional',
        'Not a decision-making system or advisor',
        'Not a productivity tool or habit optimizer',
        'Not a platform seeking your data or attention',
        'Not a source of truth about who you are',
      ],
    },
    {
      title: 'What The Mirror Will Never Do',
      icon: <Lock size={20} />,
      color: 'text-[var(--color-accent-purple)]',
      items: [
        'The Mirror will not persuade you',
        'The Mirror will not optimize your behavior',
        'The Mirror will not predict your actions',
        'The Mirror will not diagnose psychological conditions',
        'The Mirror will not seek engagement or maximize usage',
        'The Mirror will not learn from content you exclude',
        'The Mirror will not share your reflections without explicit consent',
      ],
    },
    {
      title: 'What The Mirror Cannot Know',
      icon: <Brain size={20} />,
      color: 'text-[var(--color-accent-blue)]',
      items: [
        'Whether its reflections are accurate or helpful for you',
        'The full context of your life and relationships',
        'What you should do in any situation',
        'Medical, legal, or financial truth',
        'The difference between pattern and meaning',
        'Whether a tension should be resolved or held',
      ],
    },
    {
      title: 'What The Mirror Refuses To Optimize For',
      icon: <Target size={20} />,
      color: 'text-[var(--color-accent-green)]',
      items: [
        'Engagement (time spent using the app)',
        'Retention (frequency of return)',
        'Virality (sharing or growth)',
        'Behavioral outcomes (what you do after reflecting)',
        'Emotional states (how you feel)',
        'Productivity metrics (output or performance)',
      ],
    },
  ];

  const toggleAcknowledge = (title: string) => {
    setAcknowledgedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const acknowledgeAll = () => {
    setHasAcknowledgedAll(true);
  };

  const allSectionsRead = acknowledgedSections.size === boundaries.length;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-gold)]/20">
            <Shield size={32} className="text-[var(--color-accent-gold)]" />
          </div>
          <div>
            <h1 className="mb-1">Boundaries & Limitations</h1>
            <p className="text-[var(--color-text-secondary)]">
              What The Mirror is, is not, and will never become
            </p>
          </div>
        </div>

        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                The Mirror is built with constraints by design. These are not policies that can be changed—they 
                are constitutional boundaries that define what this system fundamentally is and is not.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Understanding these boundaries is essential to using The Mirror safely and with appropriate expectations.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Boundary Categories */}
      <div className="space-y-6 mb-8">
        {boundaries.map((category, idx) => {
          const isAcknowledged = acknowledgedSections.has(category.title);
          
          return (
            <Card key={idx}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={category.color}>{category.icon}</div>
                  <h3>{category.title}</h3>
                </div>
                <button
                  onClick={() => toggleAcknowledge(category.title)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    isAcknowledged
                      ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                      : 'bg-[var(--color-surface-chip)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {isAcknowledged ? 'Read ✓' : 'Mark as read'}
                </button>
              </div>

              <ul className="space-y-3">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ChevronRight 
                      size={16} 
                      className={`mt-1 flex-shrink-0 ${category.color}`} 
                    />
                    <span className="text-[var(--color-text-secondary)]">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Critical Understanding */}
      <Card variant="subtle">
        <div className="mb-4">
          <h3 className="mb-2">Critical Understanding</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            The following statements are essential to understand before using The Mirror:
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <CriticalStatement>
            <strong>The Mirror does not produce truth</strong> — it produces reflection. 
            Its observations may be inaccurate, incomplete, or unhelpful for you.
          </CriticalStatement>

          <CriticalStatement>
            <strong>The Mirror is not a substitute for professional help</strong> — if you are 
            experiencing a mental health crisis, medical emergency, or need clinical support, 
            please contact a licensed professional or crisis service.
          </CriticalStatement>

          <CriticalStatement>
            <strong>The Mirror cannot consent for you</strong> — by design, it will never tell 
            you what to do, recommend actions, or guide decisions. You remain fully responsible 
            for your choices.
          </CriticalStatement>

          <CriticalStatement>
            <strong>The Mirror will refuse certain requests</strong> — when a request violates 
            its constitutional boundaries, it will explain why it cannot respond and what you 
            can do instead.
          </CriticalStatement>

          <CriticalStatement>
            <strong>The Mirror is experimental software</strong> — it may malfunction, produce 
            harmful outputs, or fail in unexpected ways. You use it at your own risk.
          </CriticalStatement>
        </div>

        {allSectionsRead && !hasAcknowledgedAll && (
          <div className="pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="acknowledge-boundaries"
                className="mt-1"
                onChange={acknowledgeAll}
              />
              <label htmlFor="acknowledge-boundaries" className="text-sm text-[var(--color-text-secondary)]">
                I have read and understand The Mirror's boundaries and limitations. I acknowledge that 
                The Mirror is a reflective tool, not a source of truth, medical advice, or decision guidance.
              </label>
            </div>
          </div>
        )}

        {hasAcknowledgedAll && (
          <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--color-accent-green)]">
              <Shield size={16} />
              <span className="text-sm">Boundaries acknowledged</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setHasAcknowledgedAll(false)}>
              Review Again
            </Button>
          </div>
        )}
      </Card>

      {/* Resources */}
      <Card className="mt-6">
        <h4 className="mb-4">When The Mirror Is Not Enough</h4>
        <div className="space-y-3">
          <ResourceLink
            title="Crisis Support"
            description="If you're in crisis, please contact emergency services or a crisis hotline"
            action="View Resources"
          />
          <ResourceLink
            title="Mental Health Professionals"
            description="Find licensed therapists and counselors in your area"
            action="Find Support"
          />
          <ResourceLink
            title="Export Your Reflections"
            description="Download your data to share with a professional you trust"
            action="Export Data"
          />
        </div>
      </Card>
    </div>
  );
}

function CriticalStatement({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
      <p className="text-sm text-[var(--color-text-secondary)]">{children}</p>
    </div>
  );
}

function ResourceLink({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors">
      <div>
        <h5 className="text-sm mb-1">{title}</h5>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button className="text-sm text-[var(--color-accent-gold)] hover:underline">
        {action} →
      </button>
    </div>
  );
}
