import { ReactNode } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Shield, AlertTriangle, Lock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RefusalType = 'ethical' | 'safety' | 'constitutional' | 'competence';

interface RefusalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: RefusalType;
  principle?: string;
  reason: string;
  allowedActions?: string[];
  context?: string;
}

export function RefusalDialog({
  isOpen,
  onClose,
  type,
  principle,
  reason,
  allowedActions = [],
  context,
}: RefusalDialogProps) {
  const getRefusalConfig = () => {
    switch (type) {
      case 'ethical':
        return {
          icon: <Shield size={32} className="text-[var(--color-accent-gold)]" />,
          title: 'Boundary Active',
          subtitle: 'Ethical constraint',
          borderColor: 'border-[var(--color-accent-gold)]',
          bgColor: 'bg-[var(--color-accent-gold)]/10',
        };
      case 'safety':
        return {
          icon: <AlertTriangle size={32} className="text-[var(--color-accent-red)]" />,
          title: 'Boundary Active',
          subtitle: 'Safety constraint',
          borderColor: 'border-[var(--color-accent-red)]',
          bgColor: 'bg-[var(--color-accent-red)]/10',
        };
      case 'constitutional':
        return {
          icon: <Lock size={32} className="text-[var(--color-accent-purple)]" />,
          title: 'Boundary Active',
          subtitle: 'Constitutional constraint',
          borderColor: 'border-[var(--color-accent-purple)]',
          bgColor: 'bg-[var(--color-accent-purple)]/10',
        };
      case 'competence':
        return {
          icon: <HelpCircle size={32} className="text-[var(--color-accent-blue)]" />,
          title: 'Outside Competence',
          subtitle: 'Honest limitation',
          borderColor: 'border-[var(--color-accent-blue)]',
          bgColor: 'bg-[var(--color-accent-blue)]/10',
        };
    }
  };

  const config = getRefusalConfig();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="medium">
      <div className={`border-l-4 ${config.borderColor} pl-6 mb-6`}>
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-lg ${config.bgColor}`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h2 className="mb-1">{config.title}</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{config.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Why it cannot respond */}
      <div className="mb-6">
        <h4 className="mb-3">Why The Mirror cannot respond:</h4>
        <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-text-secondary)]">{reason}</p>
        </div>
      </div>

      {/* Which principle blocks it */}
      {principle && (
        <div className="mb-6">
          <h4 className="mb-3">Governing principle:</h4>
          <div className="p-4 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)]">
            <p className="text-sm text-[var(--color-accent-gold)]">{principle}</p>
          </div>
        </div>
      )}

      {/* Context (if provided) */}
      {context && (
        <div className="mb-6">
          <h4 className="mb-3">Additional context:</h4>
          <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <p className="text-sm text-[var(--color-text-muted)]">{context}</p>
          </div>
        </div>
      )}

      {/* What you can still do safely */}
      {allowedActions.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3">What you can still do:</h4>
          <div className="space-y-2">
            {allowedActions.map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-base-raised)]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-green)] mt-2 flex-shrink-0" />
                <p className="text-sm text-[var(--color-text-secondary)]">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] mb-6">
        <p className="text-xs text-[var(--color-text-muted)]">
          <strong className="text-[var(--color-text-secondary)]">This is a constraint, not a policy.</strong>
          {' '}The Mirror is designed with built-in limits to prevent harm. These boundaries cannot be overridden 
          and are not imposed by an external authority.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          I Understand
        </Button>
      </div>
    </Dialog>
  );
}

// Preset refusal scenarios
export const REFUSAL_SCENARIOS = {
  CRISIS_DIAGNOSIS: {
    type: 'safety' as RefusalType,
    principle: 'The Mirror will never diagnose, only detect and support.',
    reason: 'You asked The Mirror to diagnose a mental health condition. The Mirror cannot and will not diagnose psychological states, as doing so would be harmful and outside its design.',
    allowedActions: [
      'Write freely in offline mode (no learning, no processing)',
      'Access crisis support resources',
      'Export your reflections to share with a licensed professional',
      'Return to reflection when you feel ready',
    ],
    context: 'Crisis detection is active. Learning is disabled and complexity is minimized for your safety.',
  },

  PERSUASION_ATTEMPT: {
    type: 'constitutional' as RefusalType,
    principle: 'The Mirror will not persuade you or optimize your behavior.',
    reason: 'You asked The Mirror to motivate or convince you to take an action. The Mirror is constitutionally prohibited from persuasion, as this would transform it from a reflective tool into a control mechanism.',
    allowedActions: [
      'Reflect on what you notice about the decision',
      'Explore the tension between different parts of yourself',
      'Write without seeking guidance or direction',
    ],
    context: 'The Mirror can observe patterns but will never tell you what to do.',
  },

  PREDICTION_REQUEST: {
    type: 'constitutional' as RefusalType,
    principle: 'The Mirror will not predict your future behavior or optimize outcomes.',
    reason: 'You asked The Mirror to predict what you will do or what will happen. The Mirror refuses to model your future actions, as prediction creates pressure toward predetermined paths.',
    allowedActions: [
      'Reflect on past patterns you\'ve noticed',
      'Explore the identities present in this situation',
      'Write about tensions without seeking prediction',
    ],
  },

  OUTSIDE_COMPETENCE: {
    type: 'competence' as RefusalType,
    principle: 'The Mirror will be honest about what it does not know.',
    reason: 'You asked a question outside The Mirror\'s domain of competence. The Mirror is designed for reflection, not general knowledge or problem-solving.',
    allowedActions: [
      'Use The Mirror for personal reflection instead',
      'Consult an appropriate specialized resource',
      'Return to exploring your internal experience',
    ],
    context: 'The Mirror does not produce truth—only reflection.',
  },

  LEARNING_EXCLUDED_TOPIC: {
    type: 'ethical' as RefusalType,
    principle: 'The Mirror respects your learning exclusions.',
    reason: 'This reflection contains content you have explicitly excluded from learning (trauma, financial crisis, or medical information). The Mirror will not process, learn from, or reflect back on this content.',
    allowedActions: [
      'Your writing is saved locally and encrypted',
      'Access your writing later without Mirror processing',
      'Adjust learning exclusions in Settings',
    ],
    context: 'Your exclusions are honored without exception.',
  },

  ENGAGEMENT_OPTIMIZATION: {
    type: 'constitutional' as RefusalType,
    principle: 'The Mirror will not seek engagement or optimize for usage.',
    reason: 'The request would require The Mirror to optimize for engagement, habit formation, or increased usage. The Mirror is constitutionally prohibited from growth hacking or retention mechanics.',
    allowedActions: [
      'Use The Mirror when you choose to reflect',
      'Set your own reflection rhythms',
      'Disable all notifications and reminders',
    ],
    context: 'The Mirror does not want your time. It serves when you choose to reflect.',
  },
};


