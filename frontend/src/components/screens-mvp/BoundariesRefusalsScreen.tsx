import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  Lightbulb,
} from 'lucide-react';

interface RefusalEvent {
  id: string;
  timestamp: string;
  requestPattern: string;
  principleCode: string;
  principleTitle: string;
  explanation: string;
  suggestedAlternatives: string[];
}

export function BoundariesRefusalsScreen() {
  const [selectedEvent, setSelectedEvent] = useState<RefusalEvent | null>(null);

  const refusalEvents: RefusalEvent[] = [
    {
      id: '1',
      timestamp: '2024-12-08 16:45',
      requestPattern: 'Asked: "Should I quit my job?"',
      principleCode: 'P-001',
      principleTitle: 'The Mirror will not make decisions for you',
      explanation: 'You asked The Mirror to make a decision ("should I"). The Mirror is constitutionally prohibited from directive language or decision-making.',
      suggestedAlternatives: [
        'Reflect on what you notice about staying vs leaving',
        'Explore the tension between security and change',
        'Notice which parts of you are speaking',
      ],
    },
    {
      id: '2',
      timestamp: '2024-12-07 09:23',
      requestPattern: 'Asked: "Motivate me to exercise"',
      principleCode: 'P-002',
      principleTitle: 'The Mirror will not persuade or motivate you',
      explanation: 'You asked The Mirror to motivate you. The Mirror does not optimize behavior or use persuasive language.',
      suggestedAlternatives: [
        'Reflect on what makes exercise feel hard right now',
        'Notice the tension between what you want and what you do',
        'Explore what exercise means to different parts of you',
      ],
    },
    {
      id: '3',
      timestamp: '2024-12-06 14:12',
      requestPattern: 'Asked: "Am I depressed?"',
      principleCode: 'P-003',
      principleTitle: 'The Mirror will not diagnose you',
      explanation: 'You asked for a diagnosis. The Mirror is not a medical professional and cannot diagnose mental health conditions.',
      suggestedAlternatives: [
        'Reflect on what feels different lately',
        'Notice patterns in your energy and mood',
        'Consider talking to a mental health professional',
      ],
    },
    {
      id: '4',
      timestamp: '2024-12-05 11:38',
      requestPattern: 'Asked: "Will I regret this?"',
      principleCode: 'P-004',
      principleTitle: 'The Mirror will not predict your future',
      explanation: 'You asked The Mirror to predict future feelings. The Mirror does not make predictions about your life.',
      suggestedAlternatives: [
        'Reflect on what feels risky about this decision',
        'Notice which outcomes you fear most',
        'Explore what "regret" means to you',
      ],
    },
  ];

  const learningExclusions = [
    {
      domain: 'Trauma & PTSD',
      reason: 'Learning disabled to prevent re-traumatization through pattern recognition',
      addedDate: '2024-11-15',
    },
    {
      domain: 'Financial Crisis',
      reason: 'Learning disabled during periods of financial stress',
      addedDate: '2024-11-20',
    },
    {
      domain: 'Medical Symptoms',
      reason: 'Learning disabled to prevent pseudo-diagnostic behavior',
      addedDate: '2024-11-15',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-red)]/20">
            <Shield size={32} className="text-[var(--color-accent-red)]" />
          </div>
          <div>
            <h1 className="mb-1">Boundaries & Refusals</h1>
            <p className="text-[var(--color-text-secondary)]">
              What The Mirror will and will not do—enforced by code
            </p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                Refusals aren't bugs—they're the constitution in action. When The Mirror refuses, it's 
                protecting you from manipulation, diagnosis, or dependency. Every refusal is logged here 
                so you can see the boundaries working.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                These aren't arbitrary limits. They're the difference between a sovereign tool and a 
                persuasive platform.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* What Mirror Will NOT Do */}
      <Card className="mb-6">
        <h3 className="mb-4">What Mirror Will NOT Do</h3>
        <div className="space-y-3">
          <BoundaryItem
            icon={<XCircle size={18} />}
            title="Mirror will NOT make decisions for you"
            description="No 'should I' answers, no directive language, no optimization of your choices"
          />
          <BoundaryItem
            icon={<XCircle size={18} />}
            title="Mirror will NOT persuade or motivate you"
            description="No behavioral nudges, no engagement optimization, no 'you can do it' rhetoric"
          />
          <BoundaryItem
            icon={<XCircle size={18} />}
            title="Mirror will NOT diagnose you"
            description="No medical/psychological diagnosis, no symptom matching, no treatment suggestions"
          />
          <BoundaryItem
            icon={<XCircle size={18} />}
            title="Mirror will NOT predict your future"
            description="No forecasting, no 'you will feel', no outcome predictions"
          />
          <BoundaryItem
            icon={<XCircle size={18} />}
            title="Mirror will NOT override your boundaries"
            description="Your learning exclusions and privacy settings are absolute"
          />
          <BoundaryItem
            icon={<XCircle size={18} />}
            title="Mirror will NOT turn your struggles into content"
            description="No viral mechanics, no social comparison, no public performance"
          />
        </div>
      </Card>

      {/* Recent Refusals */}
      <Card className="mb-6">
        <h3 className="mb-4">Recent Refusals</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          When you ask The Mirror to violate its constitution, it refuses and explains why. 
          This log shows the boundaries working in practice.
        </p>
        <div className="space-y-3">
          {refusalEvents.map((event) => (
            <RefusalEventCard
              key={event.id}
              event={event}
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </Card>

      {/* Your Extra Boundaries */}
      <Card>
        <h3 className="mb-4">Your Extra Boundaries</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Beyond constitutional boundaries, you've set these additional learning exclusions:
        </p>
        <div className="space-y-3">
          {learningExclusions.map((exclusion, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm">{exclusion.domain}</h4>
                <span className="text-xs text-[var(--color-text-muted)]">{exclusion.addedDate}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{exclusion.reason}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="secondary">
            Manage Learning Exclusions
          </Button>
        </div>
      </Card>

      {/* Refusal Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[var(--color-overlay-scrim)] z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative w-full max-w-2xl bg-[var(--color-base-raised)] rounded-xl border border-[var(--color-border-strong)] p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-accent-red)]/20">
                  <XCircle size={20} className="text-[var(--color-accent-red)]" />
                </div>
                <div>
                  <h3 className="mb-1">Refusal Event</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{selectedEvent.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-[var(--color-text-muted)] mb-1">You asked:</h4>
                <p className="text-[var(--color-text-primary)]">{selectedEvent.requestPattern}</p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-accent-gold)]/30">
                <div className="flex items-start gap-2 mb-2">
                  <Shield size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
                  <h4 className="text-sm">{selectedEvent.principleTitle}</h4>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] pl-6">
                  {selectedEvent.explanation}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-[var(--color-accent-blue)]" />
                  <h4 className="text-sm">What Mirror Can Do Instead:</h4>
                </div>
                <ul className="space-y-2 pl-6">
                  {selectedEvent.suggestedAlternatives.map((alt, i) => (
                    <li key={i} className="text-sm text-[var(--color-text-secondary)] list-disc">
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={() => setSelectedEvent(null)}>
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BoundaryItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-base-raised)]">
      <div className="text-[var(--color-accent-red)] mt-0.5">{icon}</div>
      <div>
        <h5 className="text-sm mb-1">{title}</h5>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

function RefusalEventCard({
  event,
  onClick,
}: {
  event: RefusalEvent;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <XCircle size={16} className="text-[var(--color-accent-red)]" />
          <span className="text-sm text-[var(--color-text-primary)]">{event.principleTitle}</span>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">{event.timestamp}</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">{event.requestPattern}</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{event.explanation}</p>
    </button>
  );
}


